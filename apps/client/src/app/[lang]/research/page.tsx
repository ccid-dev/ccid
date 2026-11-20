import classNames from "classnames";
import type { Metadata } from "next";
import { ResearchCard, ResearchNumber } from "@repo/blocks";
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

/** 리서치 분야 전체: 분야마다 한 장 (왼쪽 번호 · 컬러칩 / 오른쪽 큰 질문 → 대표 이미지 · 설명) — 장 사이는 넓은 여백으로 */
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
            {/* 넓은 화면: 번호가 그 장을 읽는 동안 따라옴 */}
            <div
              className={classNames(
                "lg:sticky lg:top-24 lg:col-span-2 lg:self-start",
              )}
            >
              <InView>
                <ResearchNumber number={theme.number} />
              </InView>
            </div>
            {/* 번호 → 한 박자 늦게 글 · 이미지가 떠오름 */}
            <InView delay={0.12} y={40} className={classNames("lg:col-span-8")}>
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
