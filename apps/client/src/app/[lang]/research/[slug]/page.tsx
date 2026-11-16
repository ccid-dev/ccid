import classNames from "classnames";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteImage } from "@repo/blocks";
import { ThemeDot } from "@repo/common";
import Link from "next/link";
import {
  GRID,
  ImageBento,
  PAGE_X,
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
          <div className={classNames("flex flex-col items-start gap-5")}>
            <PillLink href={localePath(lang, ROUTES.research)}>
              ← {dict.research.title}
            </PillLink>
            <span className={classNames("flex items-center gap-2.5")}>
              <ThemeDot number={theme.number} size="lg" />
              <span
                className={classNames(
                  "font-neuehaas text-sm font-medium text-sub",
                )}
              >
                {String(theme.number).padStart(2, "0")}
                {lang === "ko" && theme.title_en ? ` · ${theme.title_en}` : ""}
              </span>
            </span>
          </div>
        }
        title={localized(theme, "title", lang)}
        description={
          <p
            className={classNames(
              "text-xl leading-snug font-medium tracking-[-0.01em] whitespace-pre-line break-keep text-main",
            )}
          >
            {localized(theme, "question", lang)}
          </p>
        }
      />

      {theme.images.length ? (
        <div className={classNames(PAGE_X, "pt-12 md:pt-16")}>
          <ImageBento
            images={theme.images}
            alt={alt}
            label={dict.research.images}
          />
        </div>
      ) : null}

      <div className={classNames(PAGE_X, "pt-16 md:pt-24")}>
        <div className={classNames(GRID)}>
          <div className={classNames("flex flex-col gap-3 lg:col-span-3")}>
            {keywords.length ? (
              <>
                <h2
                  className={classNames(
                    "font-neuehaas text-sm font-medium text-sub",
                  )}
                >
                  {dict.research.keywords}
                </h2>
                <Pills items={keywords} />
              </>
            ) : null}
          </div>
          <div
            className={classNames(
              "max-w-3xl lg:col-span-7",
              "flex flex-col gap-6",
              "break-keep",
            )}
          >
            {catchphrase ? (
              <p
                className={classNames(
                  "text-2xl leading-snug font-medium tracking-[-0.02em] whitespace-pre-line",
                )}
              >
                {catchphrase}
              </p>
            ) : null}
            <p className={classNames("text-lg leading-8")}>
              {localized(theme, "summary", lang)}
            </p>
            <p className={classNames("leading-7 whitespace-pre-line text-sub")}>
              {localized(theme, "description", lang)}
            </p>
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
            {others.map((other) => (
              <li key={other.id}>
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
                    <span className={classNames("flex items-center gap-2")}>
                      <ThemeDot number={other.number} size="sm" />
                      <span
                        className={classNames(
                          "font-neuehaas text-xs font-medium text-sub",
                        )}
                      >
                        {String(other.number).padStart(2, "0")}
                      </span>
                    </span>
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
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
