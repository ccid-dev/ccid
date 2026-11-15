import classNames from "classnames";
import type { ReactNode } from "react";
import { getCurrentAdmin } from "@/libs/auth";
import { ModalRoot } from "./ModalRoot";
import { Sidebar } from "./Sidebar";
import { Toaster } from "./Toaster";

/**
 * 관리자 공통 레이아웃 (client 와 같은 밝은 바탕 · 회색 면).
 * - 승인된 계정: 왼쪽 사이드바 · 본문(main, 남은 너비 전부)
 * - 로그인 전 · 승인 대기: 사이드바 없이 화면 전체 (로그인 · 가입 화면)
 * 전역 모달(ModalRoot) · 알림(Toaster)도 여기 한 번만 둡니다.
 */
export async function Layout({ children }: { children: ReactNode }) {
  const current = await getCurrentAdmin();
  const approved = current?.profile?.status === "approved";

  return (
    <div
      className={classNames(
        "min-h-screen",
        { "md:flex": approved },
        "bg-background",
      )}
    >
      {approved ? <Sidebar /> : null}
      <main className={classNames("min-w-0 flex-1")}>{children}</main>
      <ModalRoot />
      <Toaster />
    </div>
  );
}
