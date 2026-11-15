import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { ROUTES } from "@/constants";
import { getCurrentAdmin } from "@/libs/auth";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = { title: "비밀번호 재설정" };

/** 재설정 링크로 들어오면 로그인된 상태로 이 화면에 옵니다. */
export default async function ResetPasswordPage() {
  const current = await getCurrentAdmin();
  if (!current) redirect(ROUTES.login);
  return (
    <AuthCard
      title="새 비밀번호"
      description={`${current.profile?.email ?? ""} 계정의 새 비밀번호를 정해 주세요.`}
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}
