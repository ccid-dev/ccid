import classNames from "classnames";
import Link from "next/link";
import { APP_INFO } from "@/config";
import { NAV_EXTRA_ITEM, NAV_ITEMS, ROUTES } from "@/constants";
import { localePath } from "@/i18n";
import { getDictionary, getLocale } from "@/i18n/server";
import Logo from "@/public/img/logo.svg";
import { LanguageSwitch } from "./LanguageSwitch";

/** 공개 사이트 헤더: 로고 · 가운데 메뉴(+ 구분선 뒤 Lab) · 언어 전환 · 에이전트 자리 */
export async function Header() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  return (
    <header
      className={classNames(
        "h-18",
        "sticky top-0 z-40 grid grid-cols-[1fr_auto_1fr] items-center gap-4",
        "px-5 md:px-10",
        "bg-background",
      )}
    >
      <Link
        href={localePath(locale, ROUTES.home)}
        aria-label={APP_INFO.name}
        className={classNames("justify-self-start")}
      >
        <Logo aria-hidden className={classNames("h-[26px] w-auto")} />
      </Link>

      <nav className={classNames("min-w-0", "overflow-x-auto")}>
        <div
          className={classNames(
            "flex items-center gap-6",
            "font-neuehaas text-base font-medium whitespace-nowrap",
          )}
        >
          <ul className={classNames("flex items-center gap-5 md:gap-9")}>
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <Link
                  href={localePath(locale, item.href)}
                  className={classNames("transition hover:opacity-60")}
                >
                  {dict.nav[item.key]}
                </Link>
              </li>
            ))}
          </ul>
          {NAV_EXTRA_ITEM.isVisible && (
            <>
              <span
                aria-hidden
                className={classNames("h-5 w-px", "bg-gray-500/50")}
              />
              <Link
                href={localePath(locale, NAV_EXTRA_ITEM.href)}
                className={classNames("transition hover:opacity-60")}
              >
                {dict.nav[NAV_EXTRA_ITEM.key]}
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className={classNames("flex items-center justify-self-end gap-5")}>
        <LanguageSwitch locale={locale} label={dict.language.switchLabel} />
        {/* 대화 에이전트(Let's talk) 자리 — 아직 기능 없음 */}
      </div>
    </header>
  );
}
