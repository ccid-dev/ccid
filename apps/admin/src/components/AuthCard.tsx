import classNames from "classnames";
import type { ReactNode } from "react";

/** 로그인 · 가입 · 승인 대기 화면의 가운데 흰 카드 */
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
        "min-h-[80vh]",
        "flex items-center justify-center",
        "px-4 py-12",
      )}
    >
      <div
        className={classNames(
          "w-full max-w-sm",
          "p-7 sm:p-9",
          "rounded-3xl bg-white",
        )}
      >
        <h1
          className={classNames(
            "font-neuehaas text-3xl leading-tight font-medium tracking-[-0.03em]",
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
  );
}
