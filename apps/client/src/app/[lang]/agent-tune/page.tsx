import classNames from "classnames";
import type { Metadata } from "next";
import { AgentTuner } from "./AgentTuner";
import { hasLocale } from "@/i18n";
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

  // 사이트 헤더(화면 위 고정, 72px) 아래부터 화면 높이를 씁니다.
  return (
    <div className={classNames("pt-18")}>
      <AgentTuner labels={dict.agent} />
    </div>
  );
}
