import { APP_INFO, config } from "@/config";
import {
  defaultLocale,
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
