"use client";

import classNames from "classnames";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/constants";

export type NavGroup = { label: string; items: NavItem[] };

/** 사이드바 메뉴. 지금 보고 있는 메뉴는 흰 면으로 표시합니다. */
export function SidebarNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      className={classNames(
        "-mx-4 md:mx-0",
        "flex gap-1 overflow-x-auto md:flex-col md:gap-6 md:overflow-visible",
        "px-4 md:px-0",
      )}
    >
      {groups.map((group) => (
        <div key={group.label} className={classNames("flex flex-col gap-1")}>
          <p
            className={classNames(
              "hidden md:block",
              "mb-1 px-3",
              "font-neuehaas text-[11px] font-medium tracking-[0.08em] text-mute uppercase",
            )}
          >
            {group.label}
          </p>
          <ul className={classNames("flex gap-1 md:flex-col")}>
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={classNames(
                      "h-9",
                      "flex items-center",
                      "px-3",
                      [
                        "rounded-lg transition",
                        active ? "bg-sheet/60" : "hover:bg-sheet/40",
                      ],
                      [
                        "font-neuehaas text-sm whitespace-nowrap",
                        active ? "font-medium text-main" : "text-main",
                      ],
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
