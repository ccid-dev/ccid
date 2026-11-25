import type { Metadata } from "next";
import { ProjectsTuner } from "./ProjectsTuner";
import { hasLocale } from "@/i18n";

/** 디자인 작업용 페이지 — 검색에 노출하지 않습니다. (sitemap 에도 넣지 않음) */
export const metadata: Metadata = {
  title: "Projects Tune",
  robots: { index: false, follow: false },
};

/**
 * 홈 Projects 구역 배경(HomeProjectsBackground) 튜닝 페이지.
 * 층마다 색 · 투명도 · 자리 · 크기 · 모션을 패널로 조절하고, JSON 으로 내보내
 * components/home/projects-background.json 에 붙여 넣습니다.
 */
export default async function ProjectsTunePage({
  params,
}: PageProps<"/[lang]/projects-tune">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return null;
  return <ProjectsTuner />;
}
