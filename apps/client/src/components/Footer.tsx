import classNames from "classnames";
import Link from "next/link";
import { APP_INFO } from "@/config";
import { FOOTER_PEOPLE_GROUPS, ROUTES } from "@/constants";
import { localePath } from "@/i18n";
import { getDictionary, getLocale } from "@/i18n/server";
import { getThemes } from "@/libs/content";
import Logo from "@/public/img/logo.svg";

/**
 * 공개 사이트 푸터 (헤더에서 #contact 로 이동)
 * 왼쪽 위: 글자 크기 로고(cciD.) + 아래 줄에 정식 명칭 / 오른쪽 위: People · Research 링크(+ 아래에 People 그룹 · Research 분야)와 연락처,
 * 오른쪽 아래: 주소 · 저작권
 * 배경: 보라 기운이 도는 진회색 단색 (예전 셰이더 배경 FooterBackground · /footer-tune 은 지금 쓰지 않음)
 */
export async function Footer() {
  const locale = await getLocale();
  const [dict, themes] = await Promise.all([
    getDictionary(locale),
    getThemes(),
  ]);
  const groups = [
    {
      href: ROUTES.people,
      label: dict.footer.people,
      links: FOOTER_PEOPLE_GROUPS.map((group) => ({
        href: `${ROUTES.people}#${group}`,
        label: dict.footer.peopleLinks[group],
      })),
    },
    {
      href: ROUTES.research,
      label: dict.footer.research,
      links: themes.map((theme) => ({
        href: `/research/${theme.slug}`,
        label: theme.title_en || theme.title_ko,
      })),
    },
  ];

  return (
    <footer
      id="contact"
      className={classNames(
        // 최소 높이 없이 내용만큼: 링크 · 연락처와 주소 사이가 gap-12(48px) 로 정해짐
        "grid gap-12 md:grid-cols-[47fr_53fr] md:gap-x-0",
        "px-5 pt-14 pb-10 md:px-10 md:pt-10 md:pb-8",
        "bg-[#24202e]",
        "font-neuehaas text-white",
      )}
    >
      {/* 로고는 글자 크기(대문자 높이)에 맞춤: text-base ≈ 12px · md:text-lg ≈ 13px */}
      <div className={classNames("flex flex-col gap-2.5")}>
        <Link
          href={localePath(locale, ROUTES.home)}
          aria-label={APP_INFO.name}
          className={classNames("self-start")}
        >
          <Logo aria-hidden className={classNames("h-3 w-auto md:h-[13px]")} />
        </Link>
        <p className={classNames("text-base font-medium md:text-lg")}>
          {APP_INFO.fullName}
        </p>
      </div>

      <div className={classNames("flex flex-col justify-between gap-12")}>
        {/* 링크 · 연락처: 넓은 화면에서만 나란히 (중간 화면은 오른쪽 칸이 좁아 아래로 쌓음) */}
        <div
          className={classNames(
            "flex flex-col gap-8 lg:flex-row lg:justify-between lg:gap-10",
          )}
        >
          <nav className={classNames("flex gap-12")}>
            {groups.map((group) => (
              <div
                key={group.href}
                className={classNames("flex flex-col gap-2")}
              >
                <Link
                  href={localePath(locale, group.href)}
                  className={classNames(
                    "self-start",
                    "transition",
                    "text-sm font-medium hover:text-white/60",
                  )}
                >
                  {group.label}
                </Link>
                <ul className={classNames("text-sm leading-6 text-white/55")}>
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={localePath(locale, link.href)}
                        className={classNames("transition", "hover:text-white")}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div
            className={classNames(
              "flex flex-col gap-1 lg:items-end",
              "text-sm text-white/55",
            )}
          >
            <a
              href={`mailto:${APP_INFO.email}`}
              className={classNames("transition", "hover:text-white")}
            >
              {APP_INFO.email}
            </a>
            <a
              href={`tel:${APP_INFO.phone.tel}`}
              className={classNames("transition", "hover:text-white")}
            >
              {APP_INFO.phone.label}
            </a>
          </div>
        </div>

        {/* 주소 · 저작권: 넓은 화면에서만 한 줄로 (중간 화면은 오른쪽 칸이 좁아 아래로 쌓음) */}
        <div
          className={classNames(
            "flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10",
          )}
        >
          <address
            className={classNames("flex flex-col gap-2", "text-xs not-italic")}
          >
            <p className={classNames("font-pretendard text-[13px]")}>
              {APP_INFO.address.ko}
            </p>
            <p className={classNames("leading-[18px] text-white/55")}>
              {APP_INFO.address.en}
            </p>
          </address>
          <p className={classNames("shrink-0", "text-xs text-white/55")}>
            © {new Date().getFullYear()} {APP_INFO.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
