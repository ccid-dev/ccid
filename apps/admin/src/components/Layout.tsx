import type { ReactNode } from "react";
import Link from "next/link";
import { Header } from "@repo/common";
import { APP_INFO } from "@/config";
import { ROUTES } from "@/constants";

/** 관리자 공통 레이아웃: 상단 바 · 본문(main) */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header size="wide" className="bg-paper">
        <Link
          href={ROUTES.home}
          className="text-xs font-semibold tracking-[0.16em] uppercase"
        >
          {APP_INFO.name}
        </Link>
      </Header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
