import type { Metadata } from "next";
import { AgentTuner } from "./AgentTuner";
import { hasLocale, localePath } from "@/i18n";
import { getDictionary } from "@/i18n/server";

/** 디자인 작업용 페이지 — 검색에 노출하지 않습니다. (sitemap 에도 넣지 않음) */
export const metadata: Metadata = {
  title: "Agent Tune",
  robots: { index: false, follow: false },
};

/**
 * 에이전트 구(AgentBlob) 튜닝 페이지.
 * 상황별 모션 · 셰이더 값을 조절하고 JSON 으로 내보내 components/agent-blob/presets/ 에 붙여 넣습니다.
 */
export default async function AgentTunePage({
  params,
}: PageProps<"/[lang]/agent-tune">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return null;
  const dict = await getDictionary(lang);

  // 튜닝 화면은 화면 전체를 덮습니다 (헤더 · 푸터 가림, 페이지 스크롤 없음).
  return <AgentTuner labels={dict.agent} homeHref={localePath(lang, "/")} />;
}
