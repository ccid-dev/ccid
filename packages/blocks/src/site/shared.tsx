import classNames from "classnames";
import type { ComponentType, ReactNode } from "react";
import { IMAGE_RATIOS, ThemeDot, type ImageRatio } from "@repo/common";
import { CroppedImage } from "./CroppedImage";

/**
 * 사이트(client)와 admin 미리보기가 함께 쓰는 화면 조각.
 * 데이터 조회 · 언어 고르기 · 이미지 주소 만들기는 각 앱이 하고, 여기는 받은 값을 그리기만 합니다.
 */

/** 링크 자리에 들어갈 컴포넌트 (client: next/link, 미리보기: 누르지 않는 div) */
export type SiteLink = ComponentType<{
  href: string;
  className?: string;
  onClick?: () => void;
  /** 커스텀 커서에 뜨는 설명 (cursor-label) */
  cursorLabel?: string;
  children: ReactNode;
}>;

/** 기본 링크: 일반 <a> */
export const PlainLink: SiteLink = ({
  href,
  className,
  onClick,
  cursorLabel,
  children,
}) => (
  <a
    href={href}
    className={className}
    onClick={onClick}
    cursor-label={cursorLabel}
  >
    {children}
  </a>
);

export const twoDigits = (n: number) => String(n).padStart(2, "0");

/** 작은 알약 목록 (키워드 · 해시태그). tone 으로 바탕을 고릅니다. */
export function Pills({
  items,
  prefix = "",
  tone = "sheet",
}: {
  items: string[];
  prefix?: string;
  /** sheet: 밝은 바탕 위 · white: 회색 면 위 */
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

/**
 * 이미지 자리 (회색 면 · 둥근 모서리 · 비율 고정).
 * src 는 이미 공개 주소로 바꾼 값입니다. (#crop=… 크롭 정보가 있으면 반영) 없으면 fallback 글자를 적어 둡니다.
 */
export function SiteImage({
  src,
  alt,
  ratio = "thumbnail",
  fallback = "no image",
}: {
  src: string | null | undefined;
  alt: string;
  ratio?: ImageRatio;
  fallback?: string;
}) {
  return (
    <div
      className={classNames(
        ["w-full", IMAGE_RATIOS[ratio]],
        "relative overflow-hidden",
        "rounded-2xl bg-sheet",
      )}
    >
      {src ? (
        <CroppedImage src={src} alt={alt} />
      ) : (
        <span
          className={classNames(
            "absolute inset-0 flex items-center justify-center",
            "p-3",
            "text-center text-xs break-all text-sub",
          )}
        >
          {fallback}
        </span>
      )}
    </div>
  );
}

/** NDA 표시 (검은 알약) */
export function NdaBadge({ label }: { label: string }) {
  return (
    <span
      className={classNames(
        "h-5",
        "inline-flex items-center align-middle",
        "ml-2 px-2",
        "rounded-full bg-black",
        "font-neuehaas text-[10px] font-medium text-white",
      )}
    >
      {label}
    </span>
  );
}

/** 분야 번호 알약 (컬러칩 + 번호) */
export function ThemeChip({ number }: { number: number }) {
  return (
    <span
      className={classNames(
        "h-7",
        "inline-flex items-center gap-1.5",
        "px-2.5",
        "rounded-full bg-white",
        "font-neuehaas text-xs font-medium",
      )}
    >
      <ThemeDot number={number} size="sm" />
      {twoDigits(number)}
    </span>
  );
}
