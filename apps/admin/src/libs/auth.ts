import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { config } from "@/config";
import { ROUTES } from "@/constants";
import type { AdminUser } from "@/types";
import { createClient } from "./supabase/server";

/**
 * 현재 로그인한 계정 (요청 안에서 한 번만 조회).
 * 로그인하지 않았으면 null, 로그인했지만 계정 정보가 없으면 profile 이 null 입니다.
 */
export const getCurrentAdmin = cache(async () => {
  // Supabase 키를 넣기 전에는 로그인하지 않은 상태로 봅니다.
  if (!config.supabase.url || !config.supabase.publishableKey) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return { userId, profile };
});

/** 승인된 계정만 통과. 아니면 로그인 · 승인 대기 페이지로 보냅니다. */
export async function requireAdmin(): Promise<AdminUser> {
  const current = await getCurrentAdmin();
  if (!current) redirect(ROUTES.login);
  if (current.profile?.status !== "approved") redirect(ROUTES.pending);
  return current.profile;
}

/** 메인테이너만 통과. 일반 계정은 홈으로 보냅니다. */
export async function requireMaster(): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (admin.role !== "master") redirect(ROUTES.home);
  return admin;
}

/** People 관리 화면: 메인테이너만. 일반 멤버는 본인 Profile 로 보냅니다. */
export async function requirePeopleManager(): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (admin.role !== "master") redirect(ROUTES.profile);
  return admin;
}
