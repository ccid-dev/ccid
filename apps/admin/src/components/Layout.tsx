import classNames from "classnames";
import type { ReactNode } from "react";
import { ModalRoot } from "./ModalRoot";
import { Sidebar } from "./Sidebar";
import { Toaster } from "./Toaster";

/**
 * 관리자 공통 레이아웃: 회색 바탕 · 왼쪽 사이드바 · 본문(main, 남은 너비 전부)
 * 전역 모달(ModalRoot) · 알림(Toaster)도 여기 한 번만 둡니다.
 */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className={classNames("min-h-screen", "md:flex", "bg-sheet")}>
      <Sidebar />
      <main className={classNames("min-w-0 flex-1")}>{children}</main>
      <ModalRoot />
      <Toaster />
    </div>
  );
}
