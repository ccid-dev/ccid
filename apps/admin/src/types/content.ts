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

/** 구성원 그룹 이름 (admin 표시용) */
export const PERSON_CATEGORY_LABEL: Record<PersonCategory, string> = {
  director: "Director · 디렉터",
  advisory_board: "Advisory Board · 자문위원",
  former_advisor: "Former Advisors · 전 자문위원",
  researcher: "Student Researchers · 연구원",
  intern: "Research Interns · 연구 인턴",
  alumni: "Alumni · 졸업생",
};
