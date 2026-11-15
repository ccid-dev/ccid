import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { hasLocale, type Locale } from "./config";
import { en } from "./dictionaries/en";
import { ko, type Dictionary } from "./dictionaries/ko";

const dictionaries: Record<Locale, Dictionary> = { ko, en };

/**
 * 현재 요청의 언어 (/people → "ko", /en/people → "en"). 서버 컴포넌트 어디서든 props 없이 호출합니다.
 * (next/root-params 는 클라이언트 컴포넌트에서 import 하면 빌드가 실패합니다)
 */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!hasLocale(value)) notFound();
  return value;
}

/** 현재 언어의 화면 문구. 언어를 직접 넘기면 그 언어로 돌려줍니다. (generateMetadata 등) */
export async function getDictionary(locale?: Locale): Promise<Dictionary> {
  return dictionaries[locale ?? (await getLocale())];
}
