import type { ComponentProps } from "react";
import classNames from "classnames";
import { Spinner } from "./Spinner";

/**
 * [크기, 패딩, 모서리, 글자]
 * 모서리는 버튼을 담는 면(rounded-2xl · 3xl)보다 작게 둡니다.
 */
const sizes = {
  sm: ["h-8", "px-2.5", "rounded-md", "text-xs font-medium"],
  md: ["h-10", "px-4", "rounded-lg", "text-sm font-semibold"],
  lg: ["h-11", "px-5", "rounded-lg", "text-sm font-semibold"],
} as const;

/** [배경·테두리·효과, 글자] */
const variants = {
  solid: ["bg-black hover:opacity-85", "text-white"],
  outline: ["border bg-white hover:border-black", "text-main"],
  ghost: ["hover:bg-gray-100", "text-main"],
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export type ButtonStyle = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 가로로 꽉 채우기 */
  block?: boolean;
};

/**
 * 버튼 모양 className. 링크 등 <button> 이 아닌 태그에 버튼 모양을 입힐 때 씁니다.
 *   <Link href="/" className={buttonClassName({ variant: "outline" })}>홈</Link>
 */
export function buttonClassName({
  variant = "solid",
  size = "md",
  block = false,
}: ButtonStyle = {}) {
  const [height, padding, radius, text] = sizes[size];
  const [visual, color] = variants[variant];
  return classNames(
    [height, { "w-full": block }],
    "inline-flex shrink-0 items-center justify-center gap-2",
    padding,
    [
      radius,
      visual,
      "transition disabled:pointer-events-none disabled:opacity-50",
    ],
    [text, color, "whitespace-nowrap"],
  );
}

/**
 * 버튼 (두 앱 공통).
 *   <Button>저장</Button>
 *   <Button variant="outline" size="sm">취소</Button>
 *   <Button loading>저장 중…</Button>  → 스피너 + 비활성
 */
export function Button({
  variant,
  size,
  block,
  loading = false,
  disabled,
  type = "button",
  className,
  children,
  ...props
}: ComponentProps<"button"> & ButtonStyle & { loading?: boolean }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classNames(
        buttonClassName({ variant, size, block }),
        className,
      )}
      {...props}
    >
      {loading ? <Spinner size="sm" label="" /> : null}
      {children}
    </button>
  );
}
