import classNames from "classnames";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { ROUTES } from "@/constants";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return (
    <AuthCard title="로그인" description="cciD 사이트 콘텐츠를 관리합니다.">
      {error === "link" ? (
        <p
          role="alert"
          className={classNames(
            "mb-6 p-3",
            "rounded-lg bg-field",
            "text-sm text-red-700",
          )}
        >
          링크가 만료되었거나 이미 사용되었습니다. 메인테이너에게 새 링크를
          요청해 주세요.
        </p>
      ) : null}
      <LoginForm />
      <p className={classNames("mt-6", "text-sm text-sub")}>
        계정이 없나요?{" "}
        <Link
          href={ROUTES.signup}
          className={classNames("font-medium text-main underline")}
        >
          가입하기
        </Link>
      </p>
    </AuthCard>
  );
}
