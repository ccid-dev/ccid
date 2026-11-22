import classNames from "classnames";
import type { Metadata } from "next";
import { ResearchCard } from "@repo/blocks";
import { InView, PageHeader, SiteNextLink } from "@/components/content";
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

/** 리서치 분야 전체: 분야마다 한 장 (큰 질문 → 대표 이미지 · 설명, 넓은 화면은 오른쪽 8칸) — 장 사이는 넓은 여백으로 */
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
          "flex flex-col gap-24 pt-12 pb-24 md:gap-32 md:pt-16 md:pb-32",
        )}
      >
        {themes.map((theme) => (
          <li
            key={theme.id}
            className={classNames("grid gap-y-6 lg:grid-cols-10 lg:gap-x-10")}
          >
            {/* 화면에 들어오면 글 · 이미지가 떠오름 */}
            <InView
              y={40}
              className={classNames("lg:col-span-8 lg:col-start-3")}
            >
              <ResearchCard
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
            </InView>
          </li>
        ))}
      </ol>
    </>
  );
}
