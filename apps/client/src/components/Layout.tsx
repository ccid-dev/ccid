import type { ReactNode } from "react";
import Link from "next/link";
import { Footer, Header } from "@repo/common";
import { APP_INFO } from "@/config";
import { ROUTES } from "@/constants";

/** 공개 사이트 공통 레이아웃: 헤더 · 본문(main) · 푸터 */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header>
        <Link
          href={ROUTES.home}
          className="text-sm font-semibold tracking-[0.16em] uppercase"
        >
          {APP_INFO.name}
        </Link>
      </Header>

      <main className="flex-1">{children}</main>

      <Footer name={APP_INFO.name} />
    </div>
  );
}
