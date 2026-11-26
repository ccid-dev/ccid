import classNames from "classnames";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  InView,
  MoreResearch,
  ProjectList,
  ResearchHero,
  Section,
} from "@/components/content";
import { ROUTES } from "@/constants";
import { hasLocale, localePath, localized, locales } from "@/i18n";
import { getDictionary } from "@/i18n/server";
import { getProjectsByTheme, getThemeBySlug, getThemes } from "@/libs/content";
import { mediaUrl } from "@/libs/media";
import { localeAlternates } from "@/libs/seo";

export const revalidate = 60;

/** 공개된 분야 × 언어를 빌드 때 미리 만듭니다. 새 분야는 처음 요청 때 만들어집니다. */
export async function generateStaticParams() {
  const themes = await getThemes();
  return locales.flatMap((lang) =>
    themes.map((theme) => ({ lang, slug: theme.slug })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/research/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  const theme = await getThemeBySlug(slug);
  if (!theme) return {};
  return {
    title: localized(theme, "title", lang),
    description: localized(theme, "summary", lang),
    alternates: localeAlternates(lang, `/research/${slug}`),
  };
}

export default async function ResearchPage({
  params,
}: PageProps<"/[lang]/research/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const theme = await getThemeBySlug(slug);
  if (!theme) notFound();
  const [dict, projects, themes] = await Promise.all([
    getDictionary(lang),
    getProjectsByTheme(theme.id),
    getThemes(),
  ]);
  /** 다른 리서치 분야 (이 분야 다음 번호부터 돌아가며) */
  const index = themes.findIndex((t) => t.id === theme.id);
  const others = [...themes.slice(index + 1), ...themes.slice(0, index)];
  const keywords = localized(theme, "keywords", lang);
  const alt = localized(theme, "image_alt", lang);
  const catchphrase = localized(theme, "catchphrase", lang);

  const heroImages = theme.images.flatMap((key) => mediaUrl(key) ?? []);

  return (
    <>
      {/* 맨 위 히어로: 화면 끝까지 큰 이미지 + 분야 색 그라데이션 · 세부 분야 · 영문 제목 */}
      {heroImages.length ? (
        <ResearchHero
          images={heroImages}
          alt={alt}
          keywords={keywords.join(", ")}
          title={theme.title_en || localized(theme, "title", lang)}
          number={theme.number}
          label={dict.research.images}
          prevLabel={dict.research.prevImage}
          nextLabel={dict.research.nextImage}
        />
      ) : null}
      {/* 제목 영역: 왼쪽 ← Research / 오른쪽 번호 · 영문 이름, 한글 제목, 세부 분야 알약 */}
      <div className={classNames("px-5 md:px-10", "pt-10 md:pt-14")}>
        <div className={classNames("grid gap-y-8 lg:grid-cols-10 lg:gap-x-10")}>
          <InView className={classNames("lg:col-span-2")}>
            <Link
              href={localePath(lang, ROUTES.research)}
              cursor-label="Back"
              className={classNames(
                "group inline-flex items-center gap-2",
                "font-neuehaas text-2xl leading-tight",
              )}
            >
              <span
                aria-hidden
                className={classNames(
                  "transition-transform duration-300 group-hover:-translate-x-1",
                )}
              >
                ←
              </span>
              {dict.research.title}
            </Link>
          </InView>
          <InView
            delay={0.1}
            className={classNames("flex flex-col gap-8 lg:col-span-8")}
          >
            <div className={classNames("flex flex-col gap-3")}>
              <p
                className={classNames(
                  "flex items-center gap-2.5",
                  "font-neuehaas text-sm font-medium text-gray-500",
                )}
              >
                {theme.title_en}
              </p>
              <h1
                className={classNames(
                  "text-3xl leading-tight font-medium break-keep md:text-5xl",
                )}
              >
                {localized(theme, "title", lang)}
              </h1>
            </div>
            {keywords.length ? (
              <ul className={classNames("flex flex-wrap gap-2")}>
                {keywords.map((keyword) => (
                  <li
                    key={keyword}
                    className={classNames(
                      "inline-flex px-3 py-1",
                      // 상자 하나 + 1px border: 안쪽은 바탕색, 테두리에만 그라데이션 (두께가 일정)
                      "rounded-full border border-transparent [background:linear-gradient(var(--color-background),var(--color-background))_padding-box,linear-gradient(to_right,#9e70ff_0%,#4fa7ff_35%,#9f72fd_68%,#f0a6ff_100%)_border-box]",
                      "font-neuehaas text-xs font-light",
                    )}
                  >
                    {keyword}
                  </li>
                ))}
              </ul>
            ) : null}
          </InView>
        </div>
      </div>

      {/* Focus areas: 왼쪽 제목 / 오른쪽 캐치프레이즈 → 요약 → 설명 */}
      <div className={classNames("px-5 md:px-10", "pt-24 md:pt-36")}>
        <div className={classNames("grid gap-y-6 lg:grid-cols-10 lg:gap-x-10")}>
          <InView className={classNames("lg:col-span-2")}>
            <h2 className={classNames("font-neuehaas text-2xl leading-tight")}>
              {dict.research.keywords}
            </h2>
          </InView>
          <div
            className={classNames(
              "max-w-3xl lg:col-span-8",
              "flex flex-col gap-8",
              "break-keep",
            )}
          >
            {catchphrase ? (
              <InView delay={0.1}>
                <p
                  className={classNames(
                    "text-2xl leading-[1.4] whitespace-pre-line md:text-3xl",
                  )}
                >
                  {catchphrase}
                </p>
              </InView>
            ) : null}
            <InView delay={0.2} className={classNames("flex flex-col gap-7")}>
              <p className={classNames("text-lg leading-normal")}>
                {localized(theme, "summary", lang)}
              </p>
              <p
                className={classNames(
                  "text-base leading-normal whitespace-pre-line text-gray-500",
                )}
              >
                {localized(theme, "description", lang)}
              </p>
            </InView>
          </div>
        </div>
      </div>

      <Section
        title={dict.research.projects}
        action={{
          href: `${localePath(lang, ROUTES.projects)}?research=${theme.slug}`,
          label: dict.home.viewAll,
        }}
      >
        {/* NDA: Research 페이지에서는 회사 · 그룹명을 보이지 않음 */}
        <ProjectList projects={projects} locale={lang} dict={dict} hideClient />
      </Section>

      {others.length ? (
        <Section title={dict.research.others}>
          <MoreResearch
            moreLabel={dict.research.more}
            items={others.slice(0, 4).map((other) => ({
              number: other.number,
              href: localePath(lang, `/research/${other.slug}`),
              title: localized(other, "title", lang),
              titleEn: other.title_en,
              question: localized(other, "question", lang),
              image: mediaUrl(other.images[0]),
              imageAlt: localized(other, "image_alt", lang),
            }))}
          />
        </Section>
      ) : null}
    </>
  );
}
