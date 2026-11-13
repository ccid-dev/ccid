import type { Metadata } from "next";

type Author = Exclude<NonNullable<Metadata["authors"]>, unknown[]>;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

/**
 * 환경변수 → 앱 설정.
 * NEXT_PUBLIC_* 는 빌드 시 인라인되므로 반드시 `process.env.NEXT_PUBLIC_X` 형태로 접근합니다.
 */
export const config = {
  siteUrl: trimTrailingSlash(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
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
  keywords: string[];
  url: string;
  lang: string;
  locale: string;
  authors: Author[];
  twitterCreator?: string;
  /** public 기준 경로 (1200×630) */
  ogImage: string;
  google_site_verification?: string;
  naver_site_verification?: string;
};

/** 사이트 정보 — 메타데이터, manifest, JSON-LD 의 기준값 */
export const APP_INFO: AppInfo = {
  name: "CMS Boilerplate",
  title: "CMS Boilerplate",
  titleTemplate: "%s | CMS Boilerplate",
  description:
    "Next.js · Supabase · Cloudflare R2 기반 CMS 보일러플레이트입니다.",
  keywords: ["CMS", "Next.js", "Supabase", "Cloudflare R2", "Turborepo"],
  url: config.siteUrl,
  lang: "ko",
  locale: "ko_KR",
  authors: [{ name: "ohsejiin", url: config.siteUrl }],
  twitterCreator: "@ohsejiin",
  ogImage: "/icons/op-image.png",
  google_site_verification: process.env.GOOGLE_SITE_VERIFICATION,
  naver_site_verification: process.env.NAVER_SITE_VERIFICATION,
};
