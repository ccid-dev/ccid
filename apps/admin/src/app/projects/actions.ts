"use server";

import { revalidatePath } from "next/cache";
import type { CreateState, FormState } from "@/app/actions/auth";
import { ROUTES } from "@/constants";
import { requireAdmin } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import type { TablesInsert } from "@/types";
import { formBool, formInt, formText, parseList } from "@/utils";

/** 사이트 주소 /projects#<slug> — 영문 소문자 · 숫자 · 하이픈 */
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const saveError = (error: { code?: string; message: string }) =>
  error.code === "23505"
    ? "같은 주소(slug)를 쓰는 프로젝트가 이미 있습니다."
    : `저장하지 못했습니다. (${error.message})`;

const revalidateProjects = () => {
  revalidatePath(ROUTES.projects, "layout");
  revalidatePath(ROUTES.themes, "layout");
  revalidatePath(ROUTES.home);
};

/** 제목 · 연도 검사 (만들기 · 저장 공통). 고칠 것이 있으면 row 를 바로잡습니다. */
function checkBasics(
  row: Pick<
    TablesInsert<"projects">,
    "title_ko" | "title_en" | "year_start" | "year_end"
  >,
) {
  if (!row.title_ko && !row.title_en)
    return "제목을 한국어나 영어 중 하나 이상 입력해 주세요.";
  if (row.year_start < 2000 || row.year_start > 2100)
    return "시작 연도를 2000–2100 사이로 입력해 주세요.";
  if (row.year_end != null && row.year_end < row.year_start)
    return "끝 연도는 시작 연도와 같거나 뒤여야 합니다.";
  if (row.year_end === row.year_start) row.year_end = null;
  return null;
}

/** 새 프로젝트 만들기 (모달): 제목 · 시작 연도만 받고, 나머지는 편집 화면에서 */
export async function createProject(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  await requireAdmin();
  const slug = formText(formData, "slug").toLowerCase();
  const row = {
    title_ko: formText(formData, "title_ko"),
    title_en: formText(formData, "title_en"),
    year_start: formInt(formData, "year_start") ?? 0,
    // 비우면 DB 가 영문 제목으로 만듭니다.
    ...(slug ? { slug } : {}),
  };
  const invalid = checkBasics(row);
  if (invalid) return { error: invalid };
  if (slug && !SLUG.test(slug))
    return {
      error: "주소(slug)는 영문 소문자 · 숫자 · 하이픈(-)만 쓸 수 있습니다.",
    };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert(row)
    .select("id")
    .single();
  if (error) return { error: saveError(error) };

  revalidateProjects();
  return { id: data.id, message: "새 프로젝트를 만들었습니다." };
}

/** 프로젝트 저장 (편집 화면). 리서치 분야 연결도 함께 바꾸고, 화면에 머뭅니다. */
export async function saveProject(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const row: TablesInsert<"projects"> = {
    slug: formText(formData, "slug").toLowerCase(),
    title_ko: formText(formData, "title_ko"),
    title_en: formText(formData, "title_en"),
    client_ko: formText(formData, "client_ko"),
    client_en: formText(formData, "client_en"),
    year_start: formInt(formData, "year_start") ?? 0,
    year_end: formInt(formData, "year_end"),
    tags_ko: parseList(formText(formData, "tags_ko")),
    tags_en: parseList(formText(formData, "tags_en")),
    description_ko: formText(formData, "description_ko"),
    description_en: formText(formData, "description_en"),
    is_nda: formBool(formData, "is_nda"),
    is_published: formBool(formData, "is_published"),
    sort_order: formInt(formData, "sort_order") ?? 0,
  };
  const invalid = checkBasics(row);
  if (invalid) return { error: invalid };
  if (!SLUG.test(row.slug ?? ""))
    return {
      error: "주소(slug)는 영문 소문자 · 숫자 · 하이픈(-)만 쓸 수 있습니다.",
    };

  // 리서치 분야: 주 분야가 맨 앞(position 0), 나머지는 화면 순서대로
  const themeIds = formData.getAll("theme_ids").map(String);
  const primary = formText(formData, "primary_theme");
  const ordered = themeIds.includes(primary)
    ? [primary, ...themeIds.filter((t) => t !== primary)]
    : themeIds;

  const supabase = await createClient();
  const saved = await supabase.from("projects").update(row).eq("id", id);
  if (saved.error) return { error: saveError(saved.error) };

  const removed = await supabase
    .from("project_themes")
    .delete()
    .eq("project_id", id);
  if (removed.error)
    return {
      error: `리서치 분야를 저장하지 못했습니다. (${removed.error.message})`,
    };
  if (ordered.length) {
    const linked = await supabase.from("project_themes").insert(
      ordered.map((themeId, position) => ({
        project_id: id,
        theme_id: themeId,
        position,
      })),
    );
    if (linked.error)
      return {
        error: `리서치 분야를 저장하지 못했습니다. (${linked.error.message})`,
      };
  }

  revalidateProjects();
  return { message: "저장했습니다." };
}

export async function deleteProject(id: string): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { error: `삭제하지 못했습니다. (${error.message})` };
  revalidateProjects();
  return { message: "프로젝트를 삭제했습니다." };
}
