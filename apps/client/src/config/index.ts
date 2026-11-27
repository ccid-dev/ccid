import type { Metadata } from "next";

type Author = Exclude<NonNullable<Metadata["authors"]>, unknown[]>;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

/**
 * 운영 사이트 주소. c-c-i-d.kr (www 없음) 은 Vercel 에서 이 주소로 308 리다이렉트됩니다.
 * canonical · hreflang · og:url · sitemap · robots 가 모두 이 주소를 기준으로 만들어집니다.
 */
const PRODUCTION_SITE_URL = "https://www.c-c-i-d.kr";

/** Google 태그 관리자(GTM) 컨테이너. GA4 등 측정 태그는 이 컨테이너 안(tagmanager.google.com)에서 설정합니다. */
const PRODUCTION_GTM_ID = "GTM-THV7NKCT";

/** Vercel 운영 배포인지 (Vercel 이 자동으로 넣는 값. 미리보기 = "preview", 로컬 = 없음) */
const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

/**
 * 환경변수 → 앱 설정.
 * NEXT_PUBLIC_* 는 빌드 시 인라인되므로 반드시 `process.env.NEXT_PUBLIC_X` 형태로 접근합니다.
 */
export const config = {
  /**
   * Vercel 운영 배포(NEXT_PUBLIC_VERCEL_ENV=production, Vercel 이 자동으로 넣는 값)에서는 늘 운영 주소.
   * 환경 변수가 비었거나 localhost 로 잘못 들어가 있어도 검색 엔진에 localhost 가 나가지 않게 합니다.
   * 그 밖(미리보기 · 로컬)은 NEXT_PUBLIC_SITE_URL, 없으면 localhost.
   */
  siteUrl: trimTrailingSlash(
    isProduction
      ? PRODUCTION_SITE_URL
      : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  ),
  /**
   * 방문 통계 태그: 운영 배포에서만 붙입니다 (로컬 · 미리보기 방문이 통계에 섞이지 않게).
   * 환경 변수(NEXT_PUBLIC_GTM_ID · NEXT_PUBLIC_GA_ID)가 있으면 그 값, GTM 은 없으면 위 운영 컨테이너.
   * GA4 를 GTM 안에서 연결했다면 GA_ID 는 비워 두세요. (둘 다 있으면 방문이 두 번 잡힘)
   */
  analytics: {
    gtmId: isProduction
      ? process.env.NEXT_PUBLIC_GTM_ID || PRODUCTION_GTM_ID
      : "",
    gaId: isProduction ? (process.env.NEXT_PUBLIC_GA_ID ?? "") : "",
  },
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
