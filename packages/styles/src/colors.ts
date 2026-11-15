/**
 * 색상 값 — TS 에서 값이 꼭 필요한 곳만 (viewport themeColor, mask-icon 등).
 * 색 체계의 원본은 ./global.css 의 @theme 입니다. (bg-background, text-main …)
 * global.css 에서 아래 색을 바꾸면 여기도 함께 고치세요.
 */
export const colors = {
  /** --color-background */
  background: "#fbfbfb",
  /** --text-color-main (= --color-black) */
  textMain: "#141414",
} as const;

export type ColorToken = keyof typeof colors;
