import type { Tables } from "./database";

/** 콘텐츠 테이블의 행 타입 (supabase/migrations 기준) */
export type Theme = Tables<"themes">;
export type Project = Tables<"projects">;
export type ProjectTheme = Tables<"project_themes">;
export type Person = Tables<"people">;

/** people.category 에 들어갈 수 있는 값 (DB check 제약과 같은 목록, 표시 순서) */
export const PERSON_CATEGORIES = [
  "director",
  "advisory_board",
  "former_advisor",
  "researcher",
  "intern",
  "alumni",
] as const;
export type PersonCategory = (typeof PERSON_CATEGORIES)[number];
