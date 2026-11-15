"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/app/actions/auth";
import { ROUTES } from "@/constants";
import { requireAdmin } from "@/libs/auth";
import { createAdminClient } from "@/libs/supabase/admin";
import { createClient } from "@/libs/supabase/server";
import { formBool, formText } from "@/utils";

/** 이 이름은 사이드바 · Lab Members 에 보입니다. (People 프로필 이름과는 따로) */
const MAX_NAME_LENGTH = 40;

/** 내 계정 이름 바꾸기 */
export async function updateMyName(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const me = await requireAdmin();
  const name = formText(formData, "name");
  if (!name) return { error: "이름을 입력해 주세요." };
  if (name.length > MAX_NAME_LENGTH)
    return { error: `이름은 ${MAX_NAME_LENGTH}자 이하로 정해 주세요.` };
  if (name === me.name) return { message: "바뀐 내용이 없습니다." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("admin_users")
    .update({ name })
    .eq("id", me.id);
  if (error) return { error: `이름을 바꾸지 못했습니다. (${error.message})` };

  // 사이드바 등 모든 화면의 이름을 새로 그립니다.
  revalidatePath("/", "layout");
  return { message: "이름을 바꿨습니다." };
}

/**
 * 탈퇴: 내 계정을 지웁니다. 고르면 연결된 People 프로필도 함께 지웁니다.
 * 메인테이너는 다른 메인테이너가 일반으로 바꾼 뒤에 탈퇴할 수 있습니다.
 */
export async function withdraw(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const me = await requireAdmin();
  if (me.role === "master")
    return {
      error:
        "메인테이너 계정은 탈퇴할 수 없습니다. 다른 메인테이너가 일반으로 바꾼 뒤 탈퇴해 주세요.",
    };

  const admin = createAdminClient();
  if (formBool(formData, "delete_profile")) {
    const { error } = await admin
      .from("people")
      .delete()
      .eq("admin_user_id", me.id);
    if (error)
      return { error: `프로필을 지우지 못했습니다. (${error.message})` };
  }

  const { error } = await admin.auth.admin.deleteUser(me.id);
  if (error) return { error: `탈퇴하지 못했습니다. (${error.message})` };

  // 계정이 지워졌으므로 이 브라우저의 로그인 쿠키만 정리합니다.
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect(ROUTES.login);
}
