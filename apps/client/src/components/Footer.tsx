import classNames from "classnames";
import Link from "next/link";
import { APP_INFO } from "@/config";
import { FOOTER_PEOPLE_GROUPS, ROUTES } from "@/constants";
import { localePath } from "@/i18n";
import { getDictionary, getLocale } from "@/i18n/server";
import { getThemes } from "@/libs/content";
import { FooterBackground } from "./footer-background/FooterBackground";
import Logo from "@/public/img/logo.svg";

/**
 * 공개 사이트 푸터 (헤더에서 #contact 로 이동)
 * 왼쪽: 정식 명칭 · 로고 / 오른쪽: People · Research 링크, 연락처, 주소, 저작권
 */
export async function Footer() {
  const locale = await getLocale();
  const [dict, themes] = await Promise.all([
    getDictionary(locale),
    getThemes(),
  ]);

  return (
    <footer
      id="contact"
      className={classNames(
        "md:min-h-[500px]",
        "grid gap-12 md:grid-cols-[47fr_53fr] md:gap-x-0",
        "px-5 pt-20 pb-16 md:px-10 md:pt-14 md:pb-10",
        // 배경: 위는 흰 본문과 이어지고 아래로 갈수록 일렁이는 그라디언트 (FooterBackground)
        "relative isolate overflow-hidden",
        "font-neuehaas",
      )}
    >
      <FooterBackground />
      <div
        className={classNames("flex flex-col justify-between gap-4 md:gap-12")}
      >
        <p className={classNames("text-lg md:text-2xl font-medium")}>
          {APP_INFO.fullName}
        </p>
        <Link
          href={localePath(locale, ROUTES.home)}
          aria-label={APP_INFO.name}
          className={classNames("self-start")}
        >
          <Logo aria-hidden className={classNames("h-16 md:h-32 w-auto")} />
        </Link>
      </div>

      <div className={classNames("flex flex-col justify-between gap-12")}>
        <div
          className={classNames(
            "flex flex-col gap-10 sm:flex-row sm:justify-between",
          )}
        >
          <nav className={classNames("flex gap-10 sm:gap-0")}>
            <div className={classNames("flex flex-col gap-2", "w-30 sm:w-50")}>
              <p className={classNames("text-base leading-6 font-medium")}>
                {dict.footer.people}
              </p>
              <ul className={classNames("text-base leading-7 text-sub")}>
                {FOOTER_PEOPLE_GROUPS.map((group) => (
                  <li key={group}>
                    <Link
                      href={localePath(locale, `${ROUTES.people}#${group}`)}
                      className={classNames("transition", "hover:text-main")}
                    >
                      {dict.footer.peopleLinks[group]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className={classNames("flex flex-col gap-2")}>
              <p className={classNames("text-base leading-6 font-medium")}>
                {dict.footer.research}
              </p>
              <ul className={classNames("text-base leading-7 text-sub")}>
                {themes.map((theme) => (
                  <li key={theme.id}>
                    <Link
                      href={localePath(locale, `/research/${theme.slug}`)}
                      className={classNames("transition", "hover:text-main")}
                    >
                      {theme.title_en || theme.title_ko}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div
            className={classNames(
              "flex flex-col sm:items-end",
              "text-base leading-6 text-sub",
            )}
          >
            <a
              href={`mailto:${APP_INFO.email}`}
              className={classNames("transition", "hover:text-main")}
            >
              {APP_INFO.email}
            </a>
            <a
              href={`tel:${APP_INFO.phone.tel}`}
              className={classNames("transition", "hover:text-main")}
            >
              {APP_INFO.phone.label}
            </a>
          </div>
        </div>

        <div
          className={classNames(
            "flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between",
          )}
        >
          <address
            className={classNames(
              "flex flex-col gap-3",
              "not-italic text-[14px]",
            )}
          >
            <p className={classNames("font-pretendard")}>
              {APP_INFO.address.ko}
            </p>
            <p className={classNames("leading-[18px] text-sub")}>
              {APP_INFO.address.en}
            </p>
          </address>
          <p className={classNames("text-[13px]")}>
            © {new Date().getFullYear()} {APP_INFO.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
