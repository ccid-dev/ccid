import type { Metadata } from "next";

type Author = Exclude<NonNullable<Metadata["authors"]>, unknown[]>;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

/**
 * 브라우저에도 노출돼도 되는 공개 설정.
 * 비밀 값(secret key, R2 자격증명)은 ./server.ts 에 있습니다.
 */
export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  },
  r2: {
    publicUrl: trimTrailingSlash(process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? ""),
  },
} as const;

type AppInfo = {
  name: string;
  title: string;
  titleTemplate: string;
  description: string;
  lang: string;
  authors: Author[];
};

/** 관리자 앱 정보 — 메타데이터, manifest 의 기준값 */
export const APP_INFO: AppInfo = {
  name: "CMS Admin",
  title: "CMS Admin",
  titleTemplate: "%s | CMS Admin",
  description: "콘텐츠 관리 도구",
  lang: "ko",
  authors: [{ name: "ohsejiin" }],
};
