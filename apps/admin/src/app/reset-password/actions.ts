"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/app/actions/auth";
import { MIN_PASSWORD_LENGTH, ROUTES } from "@/constants";
import { createClient } from "@/libs/supabase/server";

/** 새 비밀번호 저장 (재설정 링크로 로그인된 상태) */
export async function updatePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < MIN_PASSWORD_LENGTH)
    return {
      error: `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상으로 정해 주세요.`,
    };
  if (password !== confirm) return { error: "두 비밀번호가 다릅니다." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error)
    return {
      error:
        error.code === "same_password"
          ? "지금 비밀번호와 다른 비밀번호로 정해 주세요."
          : "비밀번호를 바꾸지 못했습니다. 링크를 다시 받아 주세요.",
    };
  redirect(ROUTES.home);
}
