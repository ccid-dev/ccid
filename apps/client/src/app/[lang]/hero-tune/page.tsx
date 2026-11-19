import type { Metadata } from "next";
import { HeroTuner } from "./HeroTuner";
import { hasLocale } from "@/i18n";
import { getDictionary } from "@/i18n/server";

/** 디자인 작업용 페이지 — 검색에 노출하지 않습니다. (sitemap 에도 넣지 않음) */
export const metadata: Metadata = {
  title: "Hero Tune",
  robots: { index: false, follow: false },
};

/**
 * 홈 첫 화면 배경(HeroBackground) 튜닝 페이지.
 * 색 분포 · 투명도 · 모션 · 페이드를 패널로 조절하고, JSON 으로 내보내
 * components/home/hero-background.json 에 붙여 넣습니다.
 */
export default async function HeroTunePage({
  params,
}: PageProps<"/[lang]/hero-tune">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return null;
  const dict = await getDictionary(lang);
  return <HeroTuner description={dict.meta.description} />;
}
