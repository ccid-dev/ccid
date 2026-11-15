import classNames from "classnames";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { ROUTES } from "@/constants";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "가입" };

export default function SignupPage() {
  return (
    <AuthCard
      title="가입"
      description="가입 후 메인테이너가 승인하면 사용할 수 있습니다."
    >
      <SignupForm />
      <p className={classNames("mt-6", "text-sm text-sub")}>
        이미 계정이 있나요?{" "}
        <Link
          href={ROUTES.login}
          className={classNames("font-medium text-main underline")}
        >
          로그인
        </Link>
      </p>
    </AuthCard>
  );
}
