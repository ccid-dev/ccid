"use server";

import { redirect } from "next/navigation";
import { MIN_PASSWORD_LENGTH, ROUTES } from "@/constants";
import { config } from "@/config";
import { createClient } from "@/libs/supabase/server";

export type FormState = { error?: string; message?: string };
/** 새로 만들기 결과: 만든 행의 id (편집 화면으로 이동할 때 씀) */
export type CreateState = FormState & { id?: string };

const AUTH_ERRORS: Record<string, string> = {
  invalid_credentials: "이메일 또는 비밀번호가 맞지 않습니다.",
  user_already_exists: "이미 가입된 이메일입니다.",
  email_exists: "이미 가입된 이메일입니다.",
  weak_password: `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상으로 정해 주세요.`,
  email_address_invalid: "이메일 형식이 올바르지 않습니다.",
  signup_disabled: "지금은 가입을 받지 않습니다.",
  over_request_rate_limit: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
};

const authErrorMessage = (code?: string) =>
  (code && AUTH_ERRORS[code]) ||
  "처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";

const NO_ENV_ERROR =
  "Supabase 가 연결되지 않았습니다. 루트 .env.local 의 NEXT_PUBLIC_SUPABASE_URL / PUBLISHABLE_KEY 를 확인하세요.";
const hasSupabaseEnv = () =>
  Boolean(config.supabase.url && config.supabase.publishableKey);

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

export async function signIn(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = text(formData, "email");
  const password = String(formData.get("password") ?? "");
  if (!email || !password)
    return { error: "이메일과 비밀번호를 입력해 주세요." };
  if (!hasSupabaseEnv()) return { error: NO_ENV_ERROR };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: authErrorMessage(error.code) };
  redirect(ROUTES.home);
}

export async function signUp(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = text(formData, "name");
  const email = text(formData, "email");
  const password = String(formData.get("password") ?? "");
  if (!name || !email || !password)
    return { error: "이름, 이메일, 비밀번호를 모두 입력해 주세요." };
  if (password.length < MIN_PASSWORD_LENGTH)
    return { error: AUTH_ERRORS.weak_password };
  if (!hasSupabaseEnv()) return { error: NO_ENV_ERROR };

  const supabase = await createClient();
  // 이메일 인증을 쓰지 않으므로 가입과 동시에 로그인됩니다. 승인 전에는 대기 화면만 보입니다.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) return { error: authErrorMessage(error.code) };
  redirect(ROUTES.home);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(ROUTES.login);
}
