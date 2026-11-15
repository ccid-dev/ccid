import { defaultLocale, locales, type Locale } from "./config";

/** row 에서 `<칸>_ko` / `<칸>_en` 쌍이 모두 있는 칸 이름 (title, tags …) */
type LocalizedField<T> = {
  [K in keyof T]: K extends `${infer Base}_ko`
    ? `${Base}_en` extends keyof T
      ? Base
      : never
    : never;
}[keyof T];

type LocalizedValue<T, K extends string> = `${K}_ko` extends keyof T
  ? T[`${K}_ko`]
  : never;

const isFilled = (value: unknown) =>
  Array.isArray(value)
    ? value.length > 0
    : typeof value === "string" && value.trim() !== "";

/**
 * DB 의 한/영 칸에서 현재 언어 값을 고릅니다. 비어 있으면 다른 언어로 대신 보여줍니다.
 *   localized(theme, "title", "en")    → theme.title_en || theme.title_ko
 *   localized(person, "name", "ko")    → person.name_ko || person.name_en
 *   localized(project, "tags", "en")   → string[]
 */
export function localized<
  T extends object,
  K extends LocalizedField<T> & string,
>(row: T, field: K, locale: Locale): LocalizedValue<T, K> {
  const values = row as Record<string, unknown>;
  const order = [locale, defaultLocale, ...locales];
  const key = order.find((l) => isFilled(values[`${field}_${l}`])) ?? locale;
  return values[`${field}_${key}`] as LocalizedValue<T, K>;
}
