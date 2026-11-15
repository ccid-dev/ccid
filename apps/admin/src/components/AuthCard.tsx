import classNames from "classnames";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeDot } from "@repo/common";
import Logo from "@/public/img/logo.svg";
import { APP_INFO } from "@/config";
import { ROUTES } from "@/constants";

/**
 * 로그인 · 가입 · 승인 대기 · 비밀번호 재설정 화면.
 * 왼쪽: 로고 · 큰 "Admin" 글자 · 리서치 컬러칩 / 오른쪽: 회색 면 위의 폼
 */
export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={classNames(
        "min-h-screen",
        "grid gap-y-12 lg:grid-cols-12 lg:gap-x-10",
        "px-5 py-6 md:px-10 md:py-8",
      )}
    >
      <div
        className={classNames(
          "flex flex-col justify-between gap-12 lg:col-span-7",
        )}
      >
        <Link
          href={ROUTES.home}
          aria-label={APP_INFO.name}
          className={classNames("flex items-center gap-2 self-start")}
        >
          <Logo aria-hidden className={classNames("h-[26px] w-auto")} />
        </Link>
        <div className={classNames("flex flex-col gap-6")}>
          <span className={classNames("flex gap-2")}>
            {[1, 2, 3, 4].map((number) => (
              <ThemeDot key={number} number={number} size="lg" />
            ))}
          </span>
          <p
            aria-hidden
            className={classNames(
              "font-neuehaas text-[clamp(4.5rem,12vw,11rem)] leading-[0.8] font-medium tracking-[-0.05em]",
            )}
          >
            Admin
          </p>
          <p className={classNames("max-w-md", "leading-7 text-sub")}>
            <span className={classNames("block", "font-neuehaas text-main")}>
              Center for Creative Intelligence Design
            </span>
            Research · Projects · People 를 관리하는 곳입니다.
          </p>
        </div>
      </div>

      <div
        className={classNames("flex items-center lg:col-span-5 lg:justify-end")}
      >
        <div
          className={classNames(
            "w-full max-w-md",
            "p-7 sm:p-10",
            "rounded-3xl bg-sheet/60",
          )}
        >
          <h1
            className={classNames(
              "font-neuehaas text-3xl leading-tight font-medium tracking-[-0.03em] break-keep",
            )}
          >
            {title}
          </h1>
          {description ? (
            <p className={classNames("mt-2", "text-sm leading-6 text-sub")}>
              {description}
            </p>
          ) : null}
          <div className={classNames("mt-8")}>{children}</div>
        </div>
      </div>
    </div>
  );
}
