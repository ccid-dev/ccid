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
  /** 정식 명칭 */
  fullName: string;
  title: string;
  titleTemplate: string;
  keywords: string[];
  email: string;
  /** 표시용 전화번호와 tel: 링크용 번호 */
  phone: { label: string; tel: string };
  /** 주소 (푸터에 두 언어 모두 표시) */
  address: { ko: string; en: string };
  url: string;
  authors: Author[];
  twitterCreator?: string;
  /** public 기준 경로 (1200×630) */
  ogImage: string;
  google_site_verification?: string;
  naver_site_verification?: string;
};

/** 사이트 정보 (언어와 무관한 값) — 메타데이터, JSON-LD 의 기준값. 언어별 문구(설명 등)는 src/i18n/dictionaries */
export const APP_INFO: AppInfo = {
  name: "cciD",
  fullName: "Center for Creative Intelligence Design",
  title: "cciD — Center for Creative Intelligence Design",
  titleTemplate: "%s | cciD",
  keywords: [
    "cciD",
    "Center for Creative Intelligence Design",
    "컴퓨테이셔널 디자인",
    "생성형 AI",
    "사용자 경험",
    "UX",
    "인간 중심 디자인",
    "Computational Design",
    "Generative AI",
  ],
  email: "hello.ccid@gmail.com",
  phone: { label: "+82 2 746 9620", tel: "+8227469620" },
  address: {
    ko: "한국예술종합학교 석관동 캠퍼스 서울 성북구 화랑로32길 146-37",
    en: "146-37 Hwarang-ro 32-gil, Seongbuk-gu,\nSeoul, Republic of Korea",
  },
  url: config.siteUrl,
  authors: [{ name: "ohsejiin", url: config.siteUrl }],
  twitterCreator: "@ohsejiin",
  ogImage: "/icons/op-image.png",
  google_site_verification: process.env.GOOGLE_SITE_VERIFICATION,
  naver_site_verification: process.env.NAVER_SITE_VERIFICATION,
};
