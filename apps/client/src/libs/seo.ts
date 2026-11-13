import { APP_INFO, config } from "@/config";

export const absoluteUrl = (path = "/") =>
  new URL(path, config.siteUrl).toString();

/** 홈에 넣는 사이트 구조화 데이터 (schema.org WebSite) */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: APP_INFO.name,
    url: absoluteUrl(),
    description: APP_INFO.description,
    inLanguage: APP_INFO.lang,
    publisher: {
      "@type": "Organization",
      name: APP_INFO.name,
      url: absoluteUrl(),
    },
  };
}
