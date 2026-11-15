// 클라이언트 컴포넌트에서도 쓸 수 있는 것만 내보냅니다. 서버 전용(getLocale, getDictionary)은 "@/i18n/server"
export {
  defaultLocale,
  hasLocale,
  localeInfo,
  localePath,
  locales,
  stripLocale,
  switchLocalePath,
  type Locale,
} from "./config";
export type { Dictionary } from "./dictionaries/ko";
export { localized } from "./localized";
