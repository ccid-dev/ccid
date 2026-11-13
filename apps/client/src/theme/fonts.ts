import localFont from "next/font/local";

export const geistSans = localFont({
  src: "../../public/fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  display: "swap",
});

export const geistMono = localFont({
  src: "../../public/fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  display: "swap",
});

/** <body className={fontVariables}> 에 적용해 Tailwind 테마(--font-sans/--font-mono)와 연결합니다. */
export const fontVariables = `${geistSans.variable} ${geistMono.variable}`;
