import type { Tables } from "./database";

/** admin 계정 (가입하면 자동 생성) */
export type AdminUser = Tables<"admin_users">;
export type AdminRole = "master" | "member";
export type AdminStatus = "pending" | "approved" | "rejected" | "suspended";

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  master: "메인테이너",
  member: "일반",
};

export const ADMIN_STATUS_LABEL: Record<AdminStatus, string> = {
  pending: "승인 대기",
  approved: "승인",
  rejected: "거절",
  suspended: "정지",
};
