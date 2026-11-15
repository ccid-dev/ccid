import type { Metadata } from "next";

type Author = Exclude<NonNullable<Metadata["authors"]>, unknown[]>;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

/**
 * 브라우저에도 노출돼도 되는 공개 설정.
 * 비밀 값은 여기에 두지 마세요.
 */
export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  },
  media: {
    /** 이미지가 들어 있는 Supabase Storage 버킷 */
    bucket: "media",
    /**
     * 이미지 키 앞에 붙는 공개 주소. NEXT_PUBLIC_MEDIA_URL 이 있으면 그 주소(다른 저장소로 옮겼을 때),
     * 없으면 Supabase Storage 공개 주소.
     */
    baseUrl: trimTrailingSlash(
      process.env.NEXT_PUBLIC_MEDIA_URL ||
        (process.env.NEXT_PUBLIC_SUPABASE_URL
          ? `${trimTrailingSlash(process.env.NEXT_PUBLIC_SUPABASE_URL)}/storage/v1/object/public/media`
          : ""),
    ),
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
  name: "cciD Admin",
  title: "cciD Admin",
  titleTemplate: "%s | cciD Admin",
  description: "cciD 사이트 콘텐츠 관리",
  lang: "ko",
  authors: [{ name: "ohsejiin" }],
};
