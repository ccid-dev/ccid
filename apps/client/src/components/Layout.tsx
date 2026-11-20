import classNames from "classnames";
import type { ReactNode } from "react";
import { getDictionary, getLocale } from "@/i18n/server";
import { websiteJsonLd } from "@/libs/seo";
import { Footer } from "./Footer";
import { CustomCursor } from "./CustomCursor";
import { PageVeil } from "./PageVeil";
import { Header } from "./Header";
import { JsonLd } from "./JsonLd";
import { AgentBlob } from "./agent-blob";

/** 공개 사이트 공통 레이아웃: 사이트 구조화 데이터 · 헤더 · 본문(main) · 푸터 */
export async function Layout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  return (
    <div className={classNames("min-h-screen", "flex flex-col")}>
      {/* 사이트 이름 · 설명 · 운영 주체 (schema.org WebSite) — 모든 페이지 공통 */}
      <JsonLd data={websiteJsonLd(locale, dict)} />
      <a
        href="#main"
        className={classNames(
          "sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50",
          "focus:px-3 focus:py-2",
          "focus:rounded-lg focus:bg-black",
          "focus:text-sm focus:text-white",
        )}
      >
        {dict.common.skipToContent}
      </a>
      <Header />
      <main id="main" className={classNames("flex-1")}>
        {children}
      </main>
      <Footer />
      {/* 에이전트 구: 누르면 대화 창(모달)으로 커짐 */}
      <AgentBlob
        mode="agent"
        labels={dict.agent}
        size={56}
        className="fixed right-5 bottom-5 z-20 md:right-8 md:bottom-8"
      />
      {/* 페이지 전환: 유리처럼 흐려졌다가 새 페이지가 준비되면 선명해짐 */}
      <PageVeil loadingLabel={dict.common.loading} />
      <CustomCursor />
    </div>
  );
}
