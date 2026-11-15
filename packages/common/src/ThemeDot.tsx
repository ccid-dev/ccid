import classNames from "classnames";

/**
 * 리서치 분야 번호 → 테마 색 (global.css 의 --color-theme-01 ~ 04)
 *   01 purple · 02 pink · 03 gold · 04 skyblue, 5번부터는 다시 01 색부터 씁니다.
 */
const THEME_BG = [
  "bg-theme-01",
  "bg-theme-02",
  "bg-theme-03",
  "bg-theme-04",
] as const;

export const themeBgClass = (number: number) =>
  THEME_BG[(Math.max(1, number) - 1) % THEME_BG.length];

const sizes = {
  sm: "size-2",
  md: "size-2.5",
  lg: "size-3.5",
} as const;

/**
 * 리서치 분야 컬러칩 (작은 동그라미).
 *   <ThemeDot number={theme.number} />
 */
export function ThemeDot({
  number,
  size = "md",
  className,
}: {
  number: number;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={classNames(
        [sizes[size], "shrink-0"],
        "inline-block",
        ["rounded-full", themeBgClass(number)],
        className,
      )}
    />
  );
}
