import "server-only";

import {
  PERSON_CATEGORIES,
  type Person,
  type Project,
  type Theme,
} from "@/types";
import { getSupabase } from "./supabase/server";

/**
 * 공개 사이트 콘텐츠 조회. publishable key 로 읽으므로 공개(is_published)된 행만 옵니다.
 * 페이지는 revalidate 주기마다 다시 만들어져 admin 수정 사항이 반영됩니다.
 */

/** 프로젝트 + 연결된 분야 (주 분야 먼저). 모달에서 분야 요약까지 보여 줍니다. */
export type ProjectWithThemes = Project & {
  themes: Pick<
    Theme,
    "number" | "slug" | "title_ko" | "title_en" | "summary_ko" | "summary_en"
  >[];
};

const PROJECT_SELECT =
  "*, project_themes(position, themes(number, slug, title_ko, title_en, summary_ko, summary_en))";

type ProjectRow = Project & {
  project_themes: {
    position: number;
    themes: ProjectWithThemes["themes"][number] | null;
  }[];
};

function withThemes(row: ProjectRow): ProjectWithThemes {
  const { project_themes, ...project } = row;
  return {
    ...project,
    themes: [...project_themes]
      .sort((a, b) => a.position - b.position)
      .flatMap((link) => (link.themes ? [link.themes] : [])),
  };
}

function check<T>(result: {
  data: T | null;
  error: { message: string } | null;
}) {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

export async function getThemes() {
  const result = await getSupabase().from("themes").select("*").order("number");
  return check(result);
}

export async function getThemeBySlug(slug: string) {
  const result = await getSupabase()
    .from("themes")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return check(result);
}

/** 공개된 프로젝트 전체 (연도 내림차순 · 순서) */
export async function getProjects() {
  const result = await getSupabase()
    .from("projects")
    .select(PROJECT_SELECT)
    .order("year_start", { ascending: false })
    .order("sort_order")
    .order("created_at");
  return (check(result) as unknown as ProjectRow[]).map(withThemes);
}

/** 한 분야에 연결된 공개 프로젝트 */
export async function getProjectsByTheme(themeId: string) {
  const links = check(
    await getSupabase()
      .from("project_themes")
      .select("project_id")
      .eq("theme_id", themeId),
  );
  const ids = new Set(links.map((link) => link.project_id));
  return (await getProjects()).filter((project) => ids.has(project.id));
}

/** 공개된 구성원을 그룹 순서대로 */
export async function getPeopleGroups() {
  const result = await getSupabase()
    .from("people")
    .select("*")
    .order("sort_order")
    .order("created_at");
  const people = check(result);
  return PERSON_CATEGORIES.map((category) => ({
    category,
    people: people.filter((person: Person) => person.category === category),
  })).filter((group) => group.people.length > 0);
}

/**
 * 모집 설정 (admin 의 Recruit 화면): Join 문구 · 모집 중 여부 · 지원 링크 · 닫혔을 때 안내.
 * 아직 표가 없거나 읽지 못하면 null (Join 은 사전 문구 · 닫힘 상태로 보입니다).
 */
export async function getRecruit() {
  const { data } = await getSupabase()
    .from("recruit")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  return data;
}
