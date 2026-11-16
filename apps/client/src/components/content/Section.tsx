import classNames from "classnames";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * 레이아웃 기준: 화면 너비 전체를 12칸으로 나누고 (바깥 여백 px-5 · md:px-10),
 * 구역마다 필요한 칸만 씁니다. 기본은 왼쪽 3칸 = 제목, 오른쪽 9칸 = 내용.
 */
export const PAGE_X = "px-5 md:px-10";
export const GRID = "grid gap-y-6 lg:grid-cols-10 lg:gap-x-10";

/**
 * 구역: 왼쪽 3칸에 제목(+ 전체 보기), 오른쪽 9칸에 내용.
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
        <div className={classNames("min-w-0 lg:col-span-9")}>{children}</div>
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
 * 페이지 머리: 왼쪽 큰 제목, 오른쪽 아래 설명.
 *   top: 제목 위 (뒤로 가기 · 번호), children: 머리 아래 덧붙일 것
 */
export function PageHeader({
  title,
  description,
  top,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  top?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={classNames(PAGE_X, "pt-14 pb-4 md:pt-20")}>
      {top ? <div className={classNames("mb-6")}>{top}</div> : null}
      <div className={classNames(GRID, "lg:items-end")}>
        <h1
          className={classNames(
            "lg:col-span-7",
            "font-neuehaas text-4xl leading-[0.98] font-medium break-keep md:text-6xl",
          )}
        >
          {title}
        </h1>
        {description ? (
          <div
            className={classNames(
              "max-w-md lg:col-span-4 lg:col-start-9",
              "text-base leading-7 text-sub",
            )}
          >
            {description}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** 작은 알약 목록 (키워드 · 해시태그). tone 으로 바탕을 고릅니다. */
export function Pills({
  items,
  prefix = "",
  tone = "sheet",
}: {
  items: string[];
  prefix?: string;
  /** sheet: 흰 바탕 위 · white: 회색 면 위 */
  tone?: "sheet" | "white";
}) {
  return (
    <ul className={classNames("flex flex-wrap gap-1.5")}>
      {items.map((item) => (
        <li
          key={item}
          className={classNames(
            "h-7",
            "inline-flex items-center",
            "px-3",
            ["rounded-full", tone === "white" ? "bg-white" : "bg-sheet/60"],
            "text-xs text-sub",
          )}
        >
          {prefix}
          {item}
        </li>
      ))}
    </ul>
  );
}
