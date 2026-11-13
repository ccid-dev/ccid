/**
 * 색상 토큰 — TS 에서 값이 필요할 때 (viewport themeColor, mask-icon 등).
 * Tailwind 유틸리티(bg-canvas, text-ink …)는 ./global.css 의 @theme 이 만듭니다.
 * 색을 바꿀 때는 이 파일과 global.css 의 @theme 을 함께 고치세요.
 */
export const colors = {
  canvas: "#f7f7f5",
  ink: "#181816",
  muted: "#72716c",
  line: "#deded9",
  paper: "#ffffff",
} as const;

export type ColorToken = keyof typeof colors;
