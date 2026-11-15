"use server";

import { revalidatePath } from "next/cache";
import type { CreateState, FormState } from "@/app/actions/auth";
import { ROUTES } from "@/constants";
import { requireAdmin, requireMaster } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import {
  PERSON_CATEGORIES,
  type PersonCategory,
  type TablesInsert,
} from "@/types";
import { formBool, formInt, formText } from "@/utils";

/** 본인도 고칠 수 있는 칸: 이름 · 직함 · 약력 · 소개 · 사진 */
function profileFields(formData: FormData) {
  const pair = (name: string) => ({
    [`${name}_ko`]: formText(formData, `${name}_ko`),
    [`${name}_en`]: formText(formData, `${name}_en`),
  });
  return {
    ...pair("name"),
    ...pair("role"),
    ...pair("bio"),
    ...pair("profile"),
    image: formText(formData, "image"),
  } as Pick<
    TablesInsert<"people">,
    | "name_ko"
    | "name_en"
    | "role_ko"
    | "role_en"
    | "bio_ko"
    | "bio_en"
    | "profile_ko"
    | "profile_en"
    | "image"
  >;
}

const saveError = (error: { code?: string; message: string }) =>
  error.code === "23505"
    ? "그 계정은 이미 다른 구성원과 연결되어 있습니다."
    : `저장하지 못했습니다. (${error.message})`;

const revalidatePeople = () => {
  revalidatePath(ROUTES.people, "layout");
  revalidatePath(ROUTES.profile);
  revalidatePath(ROUTES.members);
  revalidatePath(ROUTES.home);
};

/** 이름 · 그룹 검사 */
function checkBasics(
  fields: { name_ko?: string; name_en?: string },
  category?: string,
) {
  if (
    category !== undefined &&
    !PERSON_CATEGORIES.includes(category as PersonCategory)
  )
    return "그룹을 골라 주세요.";
  if (!fields.name_ko && !fields.name_en)
    return "이름을 한국어나 영어 중 하나 이상 입력해 주세요.";
  return null;
}

/** 새 구성원 만들기 — 메인테이너 (모달: 그룹 · 이름 · 계정 연결) */
export async function createPerson(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  await requireMaster();
  const row = {
    category: formText(formData, "category"),
    name_ko: formText(formData, "name_ko"),
    name_en: formText(formData, "name_en"),
    admin_user_id: formText(formData, "admin_user_id") || null,
  };
  const invalid = checkBasics(row, row.category);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("people")
    .insert(row)
    .select("id")
    .single();
  if (error) return { error: saveError(error) };

  revalidatePeople();
  return { id: data.id, message: "새 구성원을 만들었습니다." };
}

/** 구성원 저장 — 메인테이너 (모든 칸 · 계정 연결). 저장 후에도 화면에 머뭅니다. */
export async function savePerson(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireMaster();

  const category = formText(formData, "category") as PersonCategory;
  const row: TablesInsert<"people"> = {
    category,
    ...profileFields(formData),
    sort_order: formInt(formData, "sort_order") ?? 0,
    is_published: formBool(formData, "is_published"),
    admin_user_id: formText(formData, "admin_user_id") || null,
  };
  const invalid = checkBasics(row, category);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { error } = await supabase.from("people").update(row).eq("id", id);
  if (error) return { error: saveError(error) };

  revalidatePeople();
  return { message: "저장했습니다." };
}

export async function deletePerson(id: string): Promise<FormState> {
  await requireMaster();
  const supabase = await createClient();
  const { error } = await supabase.from("people").delete().eq("id", id);
  if (error) return { error: `삭제하지 못했습니다. (${error.message})` };
  revalidatePeople();
  return { message: "구성원을 삭제했습니다." };
}

/** 본인 프로필을 고칠 권한이 있는지 */
const canEditOwn = (me: { can_edit_profile: boolean; role: string }) =>
  me.can_edit_profile || me.role === "master";
const NO_PERMISSION =
  "프로필을 고칠 권한이 없습니다. 메인테이너에게 요청해 주세요.";

/**
 * 내 프로필 만들기 — 프로필 권한이 있는 본인 (모달: 그룹 · 이름).
 * 비공개로 만들어지고, 그룹 · 공개 여부 · 순서는 이후 메인테이너가 정합니다. (DB 트리거가 한 번 더 지킴)
 */
export async function createMyProfile(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  const me = await requireAdmin();
  if (!canEditOwn(me)) return { error: NO_PERMISSION };
  const row = {
    category: formText(formData, "category"),
    name_ko: formText(formData, "name_ko"),
    name_en: formText(formData, "name_en"),
    admin_user_id: me.id,
  };
  const invalid = checkBasics(row, row.category);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("people")
    .insert(row)
    .select("id")
    .single();
  if (error) return { error: saveError(error) };

  revalidatePeople();
  return { id: data.id, message: "프로필을 만들었습니다." };
}

/** 내 프로필 저장 — 이름 · 소개 · 사진만 고칩니다. */
export async function saveMyProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const me = await requireAdmin();
  if (!canEditOwn(me)) return { error: NO_PERMISSION };

  const fields = profileFields(formData);
  const invalid = checkBasics(fields);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("people")
    .update(fields)
    .eq("admin_user_id", me.id)
    .select("id");
  if (error) return { error: saveError(error) };
  if (!data.length) return { error: "연결된 프로필을 찾지 못했습니다." };

  revalidatePeople();
  return { message: "저장했습니다." };
}
