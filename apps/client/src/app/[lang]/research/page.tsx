import classNames from "classnames";
import type { Metadata } from "next";
import { ResearchCard, ResearchNumber } from "@repo/blocks";
import { PageHeader, SiteNextLink } from "@/components/content";
import { ROUTES } from "@/constants";
import { hasLocale, localePath, localized } from "@/i18n";
import { getDictionary } from "@/i18n/server";
import { getThemes } from "@/libs/content";
import { mediaUrl } from "@/libs/media";
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
          "px-5 md:px-10",
          "flex flex-col gap-6 pt-10 pb-24 md:pt-14",
        )}
      >
        {themes.map((theme) => (
          <li
            key={theme.id}
            className={classNames("grid gap-y-4 lg:grid-cols-10 lg:gap-x-10")}
          >
            <ResearchNumber
              number={theme.number}
              className={classNames("lg:col-span-2")}
            />
            <ResearchCard
              className={classNames("lg:col-span-8")}
              Link={SiteNextLink}
              moreLabel={dict.research.more}
              theme={{
                title: localized(theme, "title", lang),
                subtitle: lang === "ko" ? theme.title_en : "",
                question: localized(theme, "question", lang),
                summary: localized(theme, "summary", lang),
                keywords: localized(theme, "keywords", lang),
                image: mediaUrl(theme.images[0]),
                imageAlt: localized(theme, "image_alt", lang),
                href: localePath(lang, `/research/${theme.slug}`),
              }}
            />
          </li>
        ))}
      </ol>
    </>
  );
}
