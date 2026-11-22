import classNames from "classnames";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteImage } from "@repo/blocks";
import Link from "next/link";
import {
  ImageBento,
  InView,
  PageHeader,
  PillLink,
  Pills,
  ProjectList,
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

  return (
    <>
      <PageHeader
        titleSide="right"
        top={
          <div className={classNames("flex flex-col items-start")}>
            <PillLink href={localePath(lang, ROUTES.research)} arrow="left">
              {dict.research.title}
            </PillLink>
          </div>
        }
        title={localized(theme, "title", lang)}
        description={
          <p
            className={classNames(
              "text-xl leading-snug font-medium whitespace-pre-line break-keep text-main",
            )}
          >
            {localized(theme, "question", lang)}
          </p>
        }
      />

      {theme.images.length ? (
        <InView
          delay={0.15}
          y={40}
          className={classNames("px-5 md:px-10", "pt-12 md:pt-16")}
        >
          <ImageBento
            images={theme.images}
            alt={alt}
            label={dict.research.images}
            prevLabel={dict.research.prevImage}
            nextLabel={dict.research.nextImage}
          />
        </InView>
      ) : null}

      <div className={classNames("px-5 md:px-10", "pt-16 md:pt-24")}>
        <div className={classNames("grid gap-y-6 lg:grid-cols-10 lg:gap-x-10")}>
          <InView className={classNames("flex flex-col gap-5 lg:col-span-2")}>
            {keywords.length ? (
              <>
                {/* 다른 구역 제목과 같은 크기 */}
                <h2
                  className={classNames("font-neuehaas text-2xl leading-tight")}
                >
                  {dict.research.keywords}
                </h2>
                <Pills items={keywords} />
              </>
            ) : null}
          </InView>
          <div
            className={classNames(
              "max-w-3xl lg:col-span-8 2xl:max-w-4xl",
              "flex flex-col gap-10",
              "break-keep",
            )}
          >
            {/* 캐치프레이즈 (크게, 보통 굵기) → 한 칸 띄우고 요약 + 설명 (붙여서 한 덩어리) */}
            {catchphrase ? (
              <InView delay={0.1}>
                <p
                  className={classNames(
                    "text-2xl leading-snug whitespace-pre-line md:text-3xl 2xl:text-4xl",
                  )}
                >
                  {catchphrase}
                </p>
              </InView>
            ) : null}
            {/* 캐치프레이즈 → 한 박자 늦게 요약 · 설명 */}
            <InView delay={0.2} className={classNames("flex flex-col gap-4")}>
              <p
                className={classNames(
                  "text-lg leading-8 2xl:text-xl 2xl:leading-9",
                )}
              >
                {localized(theme, "summary", lang)}
              </p>
              <p
                className={classNames(
                  "text-base leading-7 whitespace-pre-line text-sub",
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
        <ProjectList projects={projects} locale={lang} dict={dict} />
      </Section>

      {others.length ? (
        <Section
          title={dict.research.others}
          action={{
            href: localePath(lang, ROUTES.research),
            label: dict.home.viewAll,
          }}
        >
          <ul
            className={classNames("grid gap-3 sm:grid-cols-2 xl:grid-cols-3")}
          >
            {others.map((other, order) => (
              <InView as="li" key={other.id} delay={order * 0.1}>
                <Link
                  href={localePath(lang, `/research/${other.slug}`)}
                  cursor-label="Open"
                  className={classNames(
                    "h-full",
                    "flex flex-col gap-4",
                    "p-2",
                    "rounded-3xl bg-sheet/60 transition hover:bg-sheet",
                  )}
                >
                  <SiteImage
                    src={mediaUrl(other.images[0])}
                    alt={localized(other, "image_alt", lang)}
                  />
                  <span
                    className={classNames(
                      "flex flex-1 flex-col gap-2",
                      "px-3 pb-3",
                    )}
                  >
                    <span
                      className={classNames(
                        "text-lg leading-snug font-medium break-keep",
                      )}
                    >
                      {localized(other, "title", lang)}
                    </span>
                    <span
                      className={classNames(
                        "line-clamp-2 text-sm leading-6 whitespace-pre-line text-sub",
                      )}
                    >
                      {localized(other, "question", lang)}
                    </span>
                  </span>
                </Link>
              </InView>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
