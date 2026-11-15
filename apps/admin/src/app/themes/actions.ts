"use server";

import { revalidatePath } from "next/cache";
import type { CreateState, FormState } from "@/app/actions/auth";
import { ROUTES } from "@/constants";
import { requireAdmin } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import type { TablesInsert } from "@/types";
import { formBool, formInt, formText, parseList } from "@/utils";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const revalidateThemes = () => {
  revalidatePath(ROUTES.themes, "layout");
  revalidatePath(ROUTES.projects, "layout");
  revalidatePath(ROUTES.home);
};

/** 번호 · 주소 · 제목 검사 (만들기 · 저장 공통) */
function checkBasics(
  row: Pick<
    TablesInsert<"themes">,
    "number" | "slug" | "title_ko" | "title_en"
  >,
) {
  if (!row.title_ko && !row.title_en)
    return "제목을 한국어나 영어 중 하나 이상 입력해 주세요.";
  if (row.number < 1) return "번호는 1 이상이어야 합니다.";
  if (!SLUG.test(row.slug))
    return "주소(slug)는 영문 소문자 · 숫자 · 하이픈(-)만 쓸 수 있습니다.";
  return null;
}

const saveError = (error: { code?: string; message: string }) =>
  error.code === "23505"
    ? "같은 번호나 주소(slug)를 쓰는 분야가 이미 있습니다."
    : `저장하지 못했습니다. (${error.message})`;

/** 새 분야 만들기 (모달): 번호 · 주소 · 제목만 받고, 나머지는 편집 화면에서 */
export async function createTheme(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  await requireAdmin();
  const row = {
    number: formInt(formData, "number") ?? 0,
    slug: formText(formData, "slug").toLowerCase(),
    title_ko: formText(formData, "title_ko"),
    title_en: formText(formData, "title_en"),
  };
  const invalid = checkBasics(row);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("themes")
    .insert(row)
    .select("id")
    .single();
  if (error) return { error: saveError(error) };

  revalidateThemes();
  return { id: data.id, message: "새 분야를 만들었습니다." };
}

/** 분야 저장 (편집 화면). 저장 후에도 화면에 머뭅니다. */
export async function saveTheme(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const pair = (name: string) => ({
    [`${name}_ko`]: formText(formData, `${name}_ko`),
    [`${name}_en`]: formText(formData, `${name}_en`),
  });
  const row = {
    number: formInt(formData, "number") ?? 0,
    slug: formText(formData, "slug").toLowerCase(),
    ...pair("title"),
    ...pair("question"),
    ...pair("summary"),
    ...pair("catchphrase"),
    ...pair("description"),
    keywords_ko: parseList(formText(formData, "keywords_ko")),
    keywords_en: parseList(formText(formData, "keywords_en")),
    images: formData.getAll("images").map(String).filter(Boolean),
    ...pair("image_alt"),
    is_published: formBool(formData, "is_published"),
  } as TablesInsert<"themes">;

  const invalid = checkBasics(row);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { error } = await supabase.from("themes").update(row).eq("id", id);
  if (error) return { error: saveError(error) };

  revalidateThemes();
  return { message: "저장했습니다." };
}

export async function deleteTheme(id: string): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("themes").delete().eq("id", id);
  if (error) return { error: `삭제하지 못했습니다. (${error.message})` };
  revalidateThemes();
  return { message: "분야를 삭제했습니다." };
}
