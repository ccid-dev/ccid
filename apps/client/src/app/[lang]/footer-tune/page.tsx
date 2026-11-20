import type { Metadata } from "next";
import { FooterTuner } from "./FooterTuner";

/** 디자인 작업용 페이지 — 검색에 노출하지 않습니다. (sitemap 에도 넣지 않음) */
export const metadata: Metadata = {
  title: "Footer Tune",
  robots: { index: false, follow: false },
};

/**
 * 푸터 배경(FooterBackground) 튜닝 페이지.
 * 셰이더 모션 · 모양 · 색, 바탕 그라디언트, 빛 번짐, 위쪽 페이드를 패널로 조절하고,
 * JSON 으로 내보내 components/footer-background/footer-background.json 에 붙여 넣습니다.
 * (푸터는 레이아웃에 있는 실제 푸터에 바로 반영됩니다)
 */
export default function FooterTunePage() {
  return <FooterTuner />;
}
