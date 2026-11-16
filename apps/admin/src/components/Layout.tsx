import classNames from "classnames";
import type { ReactNode } from "react";
import { setViewAsMember } from "@/app/actions/view";
import { getCurrentAdmin, isViewingAsMember } from "@/libs/auth";
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
  const viewingAsMember =
    approved && current?.profile
      ? await isViewingAsMember(current.profile)
      : false;

  return (
    <>
      {viewingAsMember ? (
        <form
          action={setViewAsMember.bind(null, false)}
          className={classNames(
            "flex flex-wrap items-center justify-center gap-x-3 gap-y-1",
            "px-4 py-2",
            "bg-black",
            "text-xs text-white",
          )}
        >
          <span>
            일반 멤버 화면으로 보는 중입니다. 화면만 바뀌고 권한은 그대로예요.
          </span>
          <button
            type="submit"
            className={classNames("font-medium underline underline-offset-2")}
          >
            메인테이너 화면으로
          </button>
        </form>
      ) : null}
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
    </>
  );
}
