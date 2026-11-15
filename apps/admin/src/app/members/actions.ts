"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { FormState } from "@/app/actions/auth";
import { ROUTES } from "@/constants";
import { requireMaster } from "@/libs/auth";
import { createAdminClient } from "@/libs/supabase/admin";
import { createClient } from "@/libs/supabase/server";
import type { AdminRole, AdminStatus } from "@/types";

const ROLES: AdminRole[] = ["master", "member"];
const STATUSES: AdminStatus[] = ["approved", "rejected", "suspended"];

const revalidateMembers = () => {
  revalidatePath(ROUTES.members);
  revalidatePath(ROUTES.people, "layout");
};

/**
 * People 연결 · 본인 프로필 권한 저장. approve 면 승인까지 함께 합니다. (메인테이너)
 * personId 가 null 이면 연결을 풉니다.
 */
export async function saveMemberAccess(
  id: string,
  input: { personId: string | null; canEditProfile: boolean; approve: boolean },
): Promise<FormState> {
  const me = await requireMaster();
  if (input.approve && id === me.id)
    return { error: "자기 계정은 승인할 수 없습니다." };

  const supabase = await createClient();

  // 1. 이 계정에 연결된 다른 구성원은 풀고, 고른 구성원과 연결
  const { error: unlinkError } = await supabase
    .from("people")
    .update({ admin_user_id: null })
    .eq("admin_user_id", id)
    .neq("id", input.personId ?? "00000000-0000-0000-0000-000000000000");
  if (unlinkError) return { error: unlinkError.message };
  if (input.personId) {
    const { error } = await supabase
      .from("people")
      .update({ admin_user_id: id })
      .eq("id", input.personId);
    if (error)
      return {
        error:
          error.code === "23505"
            ? "그 구성원은 이미 다른 계정과 연결되어 있습니다."
            : error.message,
      };
  }

  // 2. 프로필 권한 (+ 승인)
  const { data, error } = await supabase
    .from("admin_users")
    .update({
      can_edit_profile: input.canEditProfile,
      ...(input.approve ? { status: "approved" } : {}),
    })
    .eq("id", id)
    .select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "계정을 찾지 못했습니다." };

  revalidateMembers();
  return { message: input.approve ? "승인했습니다." : "저장했습니다." };
}

/** 상태(승인 · 거절 · 정지) · 권한(메인테이너 · 일반) 변경 (메인테이너) */
export async function updateMember(
  id: string,
  patch: { role?: AdminRole; status?: AdminStatus },
): Promise<FormState> {
  const me = await requireMaster();
  if (id === me.id)
    return { error: "자기 계정의 상태와 권한은 바꿀 수 없습니다." };
  if (patch.role && !ROLES.includes(patch.role))
    return { error: "잘못된 권한입니다." };
  if (patch.status && !STATUSES.includes(patch.status))
    return { error: "잘못된 상태입니다." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admin_users")
    .update(patch)
    .eq("id", id)
    .select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "계정을 찾지 못했습니다." };

  revalidateMembers();
  return {};
}

/**
 * 계정 삭제 (메인테이너). 연결된 People 프로필은 남고 연결만 풀립니다.
 */
export async function deleteMember(id: string): Promise<FormState> {
  const me = await requireMaster();
  if (id === me.id)
    return { error: "자기 계정은 Settings 에서 탈퇴할 수 있습니다." };

  const { error } = await createAdminClient().auth.admin.deleteUser(id);
  if (error) return { error: `삭제하지 못했습니다. (${error.message})` };

  revalidateMembers();
  return {};
}

/**
 * 비밀번호 재설정 링크 만들기 (메인테이너).
 * 이메일을 보내지 않고 링크만 만들어 돌려줍니다. 메인테이너가 본인에게 전달하면,
 * 링크를 연 사람은 로그인된 채로 새 비밀번호를 정하는 화면으로 갑니다. (한 번만 · 1시간)
 */
export async function createResetLink(
  id: string,
): Promise<FormState & { link?: string }> {
  await requireMaster();
  const supabase = await createClient();
  const { data: user } = await supabase
    .from("admin_users")
    .select("email")
    .eq("id", id)
    .maybeSingle();
  if (!user) return { error: "계정을 찾지 못했습니다." };

  const { data, error } = await createAdminClient().auth.admin.generateLink({
    type: "recovery",
    email: user.email,
  });
  if (error || !data.properties?.hashed_token)
    return { error: `링크를 만들지 못했습니다. (${error?.message ?? ""})` };

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3001";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const url = new URL(ROUTES.authConfirm, `${proto}://${host}`);
  url.searchParams.set("token_hash", data.properties.hashed_token);
  url.searchParams.set("type", "recovery");
  url.searchParams.set("next", ROUTES.resetPassword);
  return { link: url.toString() };
}
