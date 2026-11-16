import classNames from "classnames";
import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { buttonClassName, type ButtonStyle } from "@repo/common";

/** 작은 대문자 라벨 (구역 이름 · 표 머리 등). 다른 글 안에도 넣을 수 있게 span 입니다. */
export function Eyebrow({
  muted = false,
  className,
  ...props
}: ComponentProps<"span"> & {
  /** 더 옅은 글자색 (text-mute) */
  muted?: boolean;
}) {
  return (
    <span
      className={classNames("block", className, [
        "font-neuehaas text-[11px] font-medium tracking-[0.08em] uppercase",
        muted ? "text-mute" : "text-sub",
      ])}
      {...props}
    />
  );
}

/**
 * 밝은 바탕 위의 회색 면 (client 카드와 같은 bg-sheet/60). 모서리는 안에 놓이는 버튼 · 입력칸(rounded-lg)보다 크게 둡니다.
 */
export function Panel({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={classNames("rounded-3xl bg-sheet/60", className)}
      {...props}
    />
  );
}

/** 관리 화면 공통 틀: 화면 너비를 다 쓰고, 왼쪽 큰 제목 · 오른쪽 아래 설명 · 버튼 */
export function AdminPage({
  title,
  description,
  back,
  actions,
  children,
}: {
  title: string;
  description?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={classNames("px-4 pt-8 pb-16 md:px-10 md:pt-14 xl:px-14")}>
      {back ? (
        <Link
          href={back.href}
          className={classNames(
            "inline-flex",
            "transition",
            "font-neuehaas text-[11px] font-medium tracking-[0.08em] text-sub uppercase hover:text-main",
          )}
        >
          ← {back.label}
        </Link>
      ) : null}
      <div
        className={classNames(
          "grid gap-x-10 gap-y-5 lg:grid-cols-12 lg:items-end",
          { "mt-3": back },
        )}
      >
        <h1
          className={classNames(
            "lg:col-span-7",
            "font-neuehaas text-4xl leading-[1.05] font-medium tracking-[-0.035em] break-keep md:text-6xl",
          )}
        >
          {title}
        </h1>
        {description || actions ? (
          <div
            className={classNames(
              "flex flex-col gap-4 lg:col-span-5 lg:items-end",
            )}
          >
            {description ? (
              <div
                className={classNames(
                  "w-full",
                  "flex flex-wrap items-center gap-2 lg:justify-end",
                  "text-sm leading-6 text-sub lg:text-right",
                  "break-keep",
                )}
              >
                {description}
              </div>
            ) : null}
            {actions ? (
              <div className={classNames("flex gap-2")}>{actions}</div>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className={classNames("mt-10 md:mt-14")}>{children}</div>
    </div>
  );
}

/** 버튼 모양 링크 (모양은 공통 Button 과 같습니다) */
export function ButtonLink({
  href,
  children,
  className,
  ...style
}: ButtonStyle & { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={classNames(buttonClassName(style), className)}>
      {children}
    </Link>
  );
}

/** 작은 상태 표시 (알약 모양) */
export function Badge({
  children,
  tone = "default",
  dot = false,
}: {
  children: ReactNode;
  tone?: "default" | "muted" | "strong";
  /** 앞에 점 표시 */
  dot?: boolean;
}) {
  /** [배경·효과, 글자] */
  const tones = {
    default: ["bg-white", "text-main"],
    muted: ["bg-white/50", "text-mute"],
    strong: ["bg-black", "text-white"],
  } as const;
  return (
    <span
      className={classNames(
        "h-6",
        "inline-flex shrink-0 items-center gap-1.5",
        "px-2.5",
        ["rounded-full", tones[tone][0]],
        [
          "font-neuehaas text-[11px] font-medium whitespace-nowrap",
          tones[tone][1],
        ],
      )}
    >
      {dot ? (
        <span
          aria-hidden
          className={classNames("size-1.5", "rounded-full bg-current")}
        />
      ) : null}
      {children}
    </span>
  );
}

/** 공개 · 비공개 표시 */
export function PublishBadge({ published }: { published: boolean }) {
  return published ? (
    <Badge dot>공개</Badge>
  ) : (
    <Badge tone="muted" dot>
      비공개
    </Badge>
  );
}

/** 목록을 불러오지 못했을 때 */
export function LoadError({ message }: { message: string }) {
  return (
    <Panel className={classNames("p-6", "text-sm text-red-700")}>
      목록을 불러오지 못했습니다: {message}
    </Panel>
  );
}
