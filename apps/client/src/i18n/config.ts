/** 지원 언어. 클라이언트 컴포넌트와 proxy 에서도 쓰므로 서버 전용 코드를 넣지 않습니다. */
export const locales = ["ko", "en"] as const;
export type Locale = (typeof locales)[number];
/** 기본 언어. 주소에 언어가 붙지 않습니다. (/people = 한국어, /en/people = 영어) */
export const defaultLocale: Locale = "ko";

export const localeInfo: Record<
  Locale,
  { label: string; name: string; ogLocale: string }
> = {
  ko: { label: "KO", name: "한국어", ogLocale: "ko_KR" },
  en: { label: "EN", name: "English", ogLocale: "en_US" },
};

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

/**
 * 언어에 맞는 경로를 만듭니다. 한국어(기본)는 언어를 붙이지 않습니다.
 *   localePath("ko", "/people")    → "/people"
 *   localePath("en", "/")          → "/en"
 *   localePath("en", "/people")    → "/en/people"
 *   localePath("en", "/#research") → "/en#research"
 *   localePath("en", "#contact")   → "#contact" (같은 페이지 안 이동)
 */
export function localePath(locale: Locale, path = "/") {
  if (path.startsWith("#")) return path;
  const rest = path.replace(/^\/+/, "");
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  if (!rest) return prefix || "/";
  return rest.startsWith("#") ? `${prefix || "/"}${rest}` : `${prefix}/${rest}`;
}

/** 주소에서 언어를 떼어냅니다. "/en/people" → "/people", "/people" → "/people" */
export function stripLocale(pathname: string) {
  const [, first = "", ...rest] = pathname.split("/");
  return hasLocale(first) ? `/${rest.join("/")}` : pathname;
}

/** 현재 주소의 언어만 바꾼 주소. "/people" ↔ "/en/people" */
export function switchLocalePath(pathname: string, locale: Locale) {
  return localePath(locale, stripLocale(pathname));
}
