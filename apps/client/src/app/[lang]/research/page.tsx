import classNames from "classnames";
import type { Metadata } from "next";
import Link from "next/link";
import { ThemeDot } from "@repo/common";
import {
  GRID,
  MediaBox,
  PAGE_X,
  PageHeader,
  Pills,
} from "@/components/content";
import { ROUTES } from "@/constants";
import { hasLocale, localePath, localized } from "@/i18n";
import { getDictionary } from "@/i18n/server";
import { getThemes } from "@/libs/content";
import { localeAlternates } from "@/libs/seo";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/research">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.research.title,
    description: dict.research.description,
    alternates: localeAlternates(lang, ROUTES.research),
  };
}

/** 리서치 분야 전체: 분야마다 큰 면 하나 (번호 · 컬러칩 · 질문 · 요약 · 키워드 · 대표 이미지) */
export default async function ResearchIndexPage({
  params,
}: PageProps<"/[lang]/research">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return null;
  const [dict, themes] = await Promise.all([getDictionary(lang), getThemes()]);

  return (
    <>
      <PageHeader
        title={dict.research.title}
        description={dict.research.description}
      />
      <ol
        className={classNames(
          PAGE_X,
          "flex flex-col gap-6 pt-10 pb-24 md:pt-14",
        )}
      >
        {themes.map((theme) => {
          const keywords = localized(theme, "keywords", lang);
          return (
            <li key={theme.id} className={classNames(GRID, "gap-y-4")}>
              {/* 왼쪽 3칸: 번호 · 컬러칩 */}
              <div
                className={classNames(
                  "flex items-center gap-3 lg:col-span-3 lg:items-start",
                )}
              >
                <span
                  className={classNames(
                    "font-neuehaas text-4xl leading-none font-medium tracking-[-0.04em] md:text-5xl",
                  )}
                >
                  {String(theme.number).padStart(2, "0")}
                </span>
                <ThemeDot
                  number={theme.number}
                  size="lg"
                  className={classNames("lg:mt-2")}
                />
              </div>
              {/* 오른쪽 9칸: 글 · 대표 이미지 */}
              <Link
                href={localePath(lang, `/research/${theme.slug}`)}
                className={classNames(
                  "lg:col-span-9",
                  "grid gap-8 md:grid-cols-2 md:gap-12",
                  "p-6 md:p-10",
                  "rounded-3xl bg-sheet/60 transition hover:bg-sheet",
                )}
              >
                <div className={classNames("flex flex-col gap-6")}>
                  <div>
                    <h2
                      className={classNames(
                        "text-2xl leading-tight font-medium tracking-[-0.02em] break-keep md:text-3xl",
                      )}
                    >
                      {localized(theme, "title", lang)}
                    </h2>
                    {lang === "ko" && theme.title_en ? (
                      <p
                        className={classNames(
                          "mt-1.5",
                          "font-neuehaas text-sub",
                        )}
                      >
                        {theme.title_en}
                      </p>
                    ) : null}
                  </div>
                  <p
                    className={classNames(
                      "text-lg leading-8 whitespace-pre-line break-keep",
                    )}
                  >
                    {localized(theme, "question", lang)}
                  </p>
                  <p className={classNames("text-sm leading-6 text-sub")}>
                    {localized(theme, "summary", lang)}
                  </p>
                  {keywords.length ? (
                    <Pills items={keywords} tone="white" />
                  ) : null}
                  <span
                    className={classNames(
                      "mt-auto",
                      "font-neuehaas text-sm font-medium",
                    )}
                  >
                    {dict.research.more} →
                  </span>
                </div>
                {theme.images[0] ? (
                  <MediaBox
                    src={theme.images[0]}
                    alt={localized(theme, "image_alt", lang)}
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}
