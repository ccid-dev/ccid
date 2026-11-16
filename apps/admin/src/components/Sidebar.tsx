import classNames from "classnames";
import Link from "next/link";
import Logo from "@/public/img/logo.svg";
import { signOut } from "@/app/actions/auth";
import { setViewAsMember } from "@/app/actions/view";
import { APP_INFO } from "@/config";
import {
  ACCOUNT_NAV_ITEMS,
  MASTER_CONTENT_ITEM,
  MASTER_NAV_ITEMS,
  MEMBER_CONTENT_ITEM,
  NAV_ITEMS,
  ROUTES,
  TOOL_NAV_ITEMS,
  WORKSPACE_NAV_ITEMS,
} from "@/constants";
import { getCurrentAdmin, getViewRole } from "@/libs/auth";
import { ADMIN_ROLE_LABEL, type AdminRole } from "@/types";
import { SidebarNav, type NavGroup } from "./SidebarNav";

/**
 * 관리자 사이드바: 로고 · (승인된 계정이면) 메뉴 · 계정 · 로그아웃 · ©
 * 넓은 화면에서는 왼쪽에 고정되고, 좁은 화면에서는 위에 가로로 놓입니다.
 */
export async function Sidebar() {
  const current = await getCurrentAdmin();
  const profile =
    current?.profile?.status === "approved" ? current.profile : null;
  // 메인테이너가 "일반 멤버로 보기" 중이면 일반 멤버 메뉴를 보여 줍니다.
  const viewRole = profile ? await getViewRole(profile) : "member";
  const isMaster = viewRole === "master";
  const groups: NavGroup[] = profile
    ? [
        { label: "Lab", items: WORKSPACE_NAV_ITEMS },
        {
          label: "Content",
          items: [
            ...NAV_ITEMS,
            isMaster ? MASTER_CONTENT_ITEM : MEMBER_CONTENT_ITEM,
          ],
        },
        {
          label: "System",
          items: [
            ...(isMaster ? MASTER_NAV_ITEMS : []),
            ...TOOL_NAV_ITEMS,
            ...ACCOUNT_NAV_ITEMS,
          ],
        },
      ]
    : [];

  return (
    <aside
      className={classNames(
        "w-full md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0",
        "flex flex-col gap-5 md:gap-10",
        "px-4 pt-4 md:px-5 md:py-8",
      )}
    >
      <div className={classNames("flex items-center justify-between")}>
        <Link
          href={ROUTES.home}
          aria-label={APP_INFO.name}
          className={classNames("flex items-center gap-2", "md:px-3")}
        >
          <Logo aria-hidden className={classNames("h-[22px] w-auto")} />
          <span
            className={classNames(
              "h-5",
              "inline-flex items-center",
              "px-2",
              "rounded-full bg-sheet/60",
              "font-neuehaas text-[10px] font-medium tracking-[0.08em] text-sub uppercase",
            )}
          >
            Admin
          </span>
        </Link>
        {current ? (
          <form action={signOut} className={classNames("md:hidden")}>
            <button
              type="submit"
              className={classNames(
                "transition",
                "font-neuehaas text-sm text-sub hover:text-main",
              )}
            >
              로그아웃
            </button>
          </form>
        ) : null}
      </div>

      {groups.length ? <SidebarNav groups={groups} /> : null}

      <div
        className={classNames("hidden md:flex md:flex-col md:gap-4", "mt-auto")}
      >
        {current ? (
          <div
            className={classNames(
              "flex flex-col gap-3",
              "p-4",
              "rounded-2xl bg-sheet/60",
            )}
          >
            <div className={classNames("min-w-0")}>
              <p className={classNames("truncate", "text-sm font-medium")}>
                {current.profile?.name || "이름 없음"}
              </p>
              <p className={classNames("truncate", "text-xs text-sub")}>
                {current.profile?.email}
              </p>
            </div>
            <div className={classNames("flex items-center justify-between")}>
              <span
                className={classNames(
                  "font-neuehaas text-[11px] font-medium tracking-[0.08em] text-mute uppercase",
                )}
              >
                {profile
                  ? ADMIN_ROLE_LABEL[profile.role as AdminRole]
                  : "승인 대기"}
                {profile?.role === "master" && !isMaster
                  ? " · 멤버로 보는 중"
                  : ""}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  className={classNames(
                    "transition",
                    "font-neuehaas text-xs font-medium text-sub hover:text-main",
                  )}
                >
                  로그아웃
                </button>
              </form>
            </div>
            {profile?.role === "master" ? (
              <form action={setViewAsMember.bind(null, isMaster)}>
                <button
                  type="submit"
                  className={classNames(
                    "h-8 w-full",
                    "rounded-lg bg-white transition hover:bg-sheet",
                    "text-xs font-medium",
                  )}
                >
                  {isMaster ? "일반 멤버로 보기" : "메인테이너 화면으로"}
                </button>
              </form>
            ) : null}
          </div>
        ) : null}
        <p className={classNames("font-neuehaas text-[11px] text-mute")}>
          © {new Date().getFullYear()} {APP_INFO.name}
        </p>
      </div>
    </aside>
  );
}
