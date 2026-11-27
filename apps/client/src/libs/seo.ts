import type { Metadata } from "next";
import { APP_INFO, config } from "@/config";
import {
  defaultLocale,
  localeInfo,
  localePath,
  locales,
  type Dictionary,
  type Locale,
} from "@/i18n";

export const absoluteUrl = (path = "/") =>
  new URL(path, config.siteUrl).toString();

/**
 * 페이지 metadata 의 alternates: 현재 언어 canonical + 언어별 주소(hreflang)
 *   export async function generateMetadata({ params }) {
 *     return { alternates: localeAlternates(lang, "/people") };
 *   }
 */
export function localeAlternates(locale: Locale, path = "/") {
  return {
    canonical: localePath(locale, path),
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, localePath(l, path)])),
      "x-default": localePath(defaultLocale, path),
    },
  };
}

/**
 * 공유 미리보기(og · twitter) 기본값 — 레이아웃(홈)과 각 페이지가 함께 씁니다.
 * Next.js 는 openGraph · twitter 를 페이지에서 다시 주면 레이아웃 값을 통째로 바꾸므로(합치지 않음),
 * 페이지마다 이 기본값 위에 제목 · 설명 · 주소만 바꿔서 넣습니다.
 */
export function shareMetadata(
  locale: Locale,
  {
    title = APP_INFO.title,
    description,
    path = "/",
  }: { title?: string; description: string; path?: string },
): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website",
      siteName: APP_INFO.name,
      title,
      description,
      locale: localeInfo[locale].ogLocale,
      alternateLocale: locales
        .filter((other) => other !== locale)
        .map((other) => localeInfo[other].ogLocale),
      url: localePath(locale, path),
      images: { url: APP_INFO.ogImage },
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: APP_INFO.twitterCreator,
      images: [APP_INFO.ogImage],
    },
  };
}

/**
 * 하위 페이지 metadata: 제목 · 설명 · canonical/hreflang · 공유 미리보기를 그 페이지에 맞게.
 *   (title 이 있으면 "제목 | cciD", description 이 없으면 사이트 설명)
 *   export async function generateMetadata({ params }) {
 *     return pageMetadata(lang, dict, { path: "/people", title: dict.people.title });
 *   }
 */
export function pageMetadata(
  locale: Locale,
  dict: Dictionary,
  {
    path = "/",
    title,
    description,
  }: { path?: string; title?: string; description?: string },
): Metadata {
  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    alternates: localeAlternates(locale, path),
    ...shareMetadata(locale, {
      title: title ? APP_INFO.titleTemplate.replace("%s", title) : undefined,
      description: description ?? dict.meta.description,
      path,
    }),
  };
}

/** 사이트 구조화 데이터 (schema.org WebSite) — components/Layout 에서 모든 페이지에 넣습니다. */
export function websiteJsonLd(locale: Locale, dict: Dictionary) {
  const url = absoluteUrl(localePath(locale));
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: APP_INFO.name,
    alternateName: APP_INFO.fullName,
    url,
    description: dict.meta.description,
    inLanguage: locale,
    publisher: {
      "@type": "Organization",
      name: APP_INFO.name,
      alternateName: APP_INFO.fullName,
      url,
      email: APP_INFO.email,
    },
  };
}
