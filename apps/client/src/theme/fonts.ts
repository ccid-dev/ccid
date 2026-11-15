import localFont from "next/font/local";

/** 한글 본문 폰트 (가변 폰트, weight 45–920). Tailwind: font-pretendard (기본 폰트) */
export const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard-variable",
  weight: "45 920",
  display: "swap",
});

/** <html className={fontVariables}> 에 적용해 Tailwind 테마(packages/styles/src/global.css)와 연결합니다. */
export const fontVariables = pretendard.variable;
