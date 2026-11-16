import classNames from "classnames";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * 레이아웃 기준: 화면 너비 전체를 10칸으로 나누고 (바깥 여백 px-5 · md:px-10),
 * 왼쪽 3칸 = 제목, 오른쪽 7칸 = 내용. (홈 첫 화면만 자유 배치)
 */
export const PAGE_X = "px-5 md:px-10";
export const GRID = "grid gap-y-6 lg:grid-cols-10 lg:gap-x-10";

/**
 * 구역: 왼쪽 3칸에 제목(+ 전체 보기), 오른쪽 7칸에 내용.
 * 넓은 화면에서는 제목이 스크롤을 따라옵니다.
 */
export function Section({
  id,
  title,
  action,
  children,
}: {
  id?: string;
  title: string;
  /** 제목 아래 링크 (예: 전체 보기 → /projects) */
  action?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={classNames("scroll-mt-20", PAGE_X, "py-16 md:py-24")}
    >
      <div className={classNames(GRID)}>
        <header
          className={classNames(
            "flex items-end justify-between gap-4 lg:col-span-3 lg:flex-col lg:items-start lg:justify-start",
            "lg:sticky lg:top-24 lg:self-start",
          )}
        >
          <h2
            className={classNames(
              "font-neuehaas text-2xl leading-tight font-medium tracking-[-0.02em]",
            )}
          >
            {title}
          </h2>
          {action ? (
            <PillLink href={action.href}>{action.label} →</PillLink>
          ) : null}
        </header>
        <div className={classNames("min-w-0 lg:col-span-7")}>{children}</div>
      </div>
    </section>
  );
}

/** 알약 모양 링크 (면 기반) */
export function PillLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={classNames(
        "h-9 shrink-0",
        "inline-flex items-center",
        "px-4",
        "rounded-full bg-sheet/60 transition hover:bg-sheet",
        "font-neuehaas text-sm font-medium whitespace-nowrap",
      )}
    >
      {children}
    </Link>
  );
}

/**
 * 페이지 머리 (구역과 같은 왼쪽 3칸 · 오른쪽 7칸 틀).
 * - 목록 페이지: 왼쪽에 큰 제목, 오른쪽에 설명 (titleSide="left", 기본)
 * - 상세 페이지: 왼쪽에 top(뒤로 가기 · 번호), 오른쪽에 큰 제목 · 설명 (titleSide="right")
 */
export function PageHeader({
  title,
  description,
  top,
  titleSide = "left",
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  top?: ReactNode;
  titleSide?: "left" | "right";
  children?: ReactNode;
}) {
  const heading = (
    <h1
      className={classNames(
        "font-neuehaas text-4xl leading-[1.02] font-medium tracking-[-0.03em] break-keep md:text-6xl",
      )}
    >
      {title}
    </h1>
  );
  return (
    <div className={classNames(PAGE_X, "pt-14 pb-4 md:pt-20")}>
      <div
        className={classNames(GRID, { "lg:items-end": titleSide === "left" })}
      >
        <div className={classNames("flex flex-col gap-6 lg:col-span-3")}>
          {top}
          {titleSide === "left" ? heading : null}
        </div>
        <div
          className={classNames("min-w-0 lg:col-span-7", "flex flex-col gap-4")}
        >
          {titleSide === "right" ? heading : null}
          {description ? (
            <div
              className={classNames(
                "max-w-2xl",
                "text-base leading-7 text-sub",
              )}
            >
              {description}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}

/** 작은 알약 목록 (키워드 · 해시태그) — admin 미리보기와 같은 공용 컴포넌트 */
export { Pills } from "@repo/blocks";
