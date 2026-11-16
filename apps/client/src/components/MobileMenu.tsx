"use client";

import classNames from "classnames";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { stripLocale } from "@/i18n";

export type MenuLink = { label: string; href: string };

/**
 * 모바일 메뉴 (768px 미만): 햄버거 버튼 → 헤더 아래 화면 전체 메뉴.
 * 큰 글자 메뉴 · 아래쪽 연락처. 메뉴를 누르거나 Esc 를 누르면 닫힙니다.
 */
export function MobileMenu({
  links,
  contact,
  labels,
}: {
  links: MenuLink[];
  contact: { email: string; phone: { label: string; tel: string } };
  labels: { open: string; close: string };
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuId = useId();

  // 열려 있는 동안: 뒤 화면 스크롤 막기 · Esc 로 닫기
  useEffect(() => {
    if (!open) return;
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.documentElement.style.overflow = overflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  /** 지금 보고 있는 메뉴 (홈의 구역 링크는 제외). 언어 부분(/en · 내부 /ko)은 떼고 비교합니다. */
  const current = stripLocale(pathname);
  const isCurrent = (href: string) => {
    if (href.includes("#")) return false;
    const target = stripLocale(href);
    return current === target || current.startsWith(`${target}/`);
  };

  return (
    <div className={classNames("md:hidden")}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? labels.close : labels.open}
        onClick={() => setOpen(!open)}
        className={classNames(
          "size-10",
          "relative -mr-2 flex items-center justify-center",
        )}
      >
        {/* 두 줄 → X */}
        <span
          aria-hidden
          className={classNames(
            "h-[1.5px] w-5",
            "absolute",
            "bg-black transition duration-300",
            open ? "rotate-45" : "-translate-y-[4px]",
          )}
        />
        <span
          aria-hidden
          className={classNames(
            "h-[1.5px] w-5",
            "absolute",
            "bg-black transition duration-300",
            open ? "-rotate-45" : "translate-y-[4px]",
          )}
        />
      </button>

      <div
        id={menuId}
        inert={!open}
        className={classNames(
          "fixed inset-x-0 top-18 bottom-0 z-30",
          "flex flex-col justify-between",
          "px-5 pt-8 pb-[calc(env(safe-area-inset-bottom)+2rem)]",
          [
            "bg-background transition duration-300",
            open
              ? "visible translate-y-0 opacity-100"
              : "invisible -translate-y-2 opacity-0",
          ],
        )}
      >
        <nav>
          <ul className={classNames("flex flex-col gap-1")}>
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={isCurrent(link.href) ? "page" : undefined}
                  className={classNames(
                    "block",
                    "py-1",
                    "font-neuehaas text-5xl leading-tight font-medium tracking-[-0.03em]",
                    isCurrent(link.href) ? "text-main" : "text-gray-300",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div
          className={classNames(
            "flex flex-col gap-1",
            "font-neuehaas text-base text-sub",
          )}
        >
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <a href={`tel:${contact.phone.tel}`}>{contact.phone.label}</a>
        </div>
      </div>
    </div>
  );
}
