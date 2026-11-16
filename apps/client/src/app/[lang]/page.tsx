import classNames from "classnames";
import type { Metadata } from "next";
import {
  JoinSection,
  PAGE_X,
  PartnerMarquee,
  Section,
} from "@/components/content";
import { HomeAbout, HomeProjects, HomeResearch } from "@/components/home";
import { APP_INFO } from "@/config";
import { PARTNERS, ROUTES } from "@/constants";
import { hasLocale, localePath } from "@/i18n";
import { getDictionary } from "@/i18n/server";
import { getProjects, getRecruit, getThemes } from "@/libs/content";
import { localeAlternates } from "@/libs/seo";

/** admin 에서 바꾼 내용이 최대 60초 뒤 반영됩니다. */
export const revalidate = 60;

/** 홈에 보이는 최근 프로젝트 수 (전체는 /projects) */
const HOME_PROJECT_COUNT = 6;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { alternates: localeAlternates(lang) } : {};
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return null;
  const [dict, themes, projects, recruit] = await Promise.all([
    getDictionary(lang),
    getThemes(),
    getProjects(),
    getRecruit(),
  ]);

  return (
    <>
      {/* 첫 화면: 왼쪽 아래 큰 이름, 오른쪽 아래 정식 명칭 · 소개 (자세한 소개는 아래 About) */}
      <div
        className={classNames(
          "min-h-[30svh] md:min-h-[68svh]",
          "flex flex-col justify-end",
          PAGE_X,
          "pt-24 pb-4 md:pb-14",
        )}
      >
        <div
          className={classNames(
            "w-full h-fit",
            "flex flex-col md:flex-row justify-between",
            "gap-4 md:gap-0",
            "items-start md:items-end",
          )}
        >
          <h1
            className={classNames(
              "hidden md:block",
              "font-neuehaas md:text-[clamp(4.5rem,13vw,12rem)] leading-[0.8] font-medium tracking-[-0.05em]",
            )}
          >
            {APP_INFO.name}
          </h1>
          <div className={classNames("max-w-md", "flex flex-col gap-3")}>
            <p className={classNames("font-neuehaas text-lg font-medium")}>
              {APP_INFO.fullName}
            </p>
            <p
              className={classNames(
                "text-sm md:text-base",
                "leading-snug break-keep text-sub",
              )}
            >
              {dict.meta.description}
            </p>
          </div>
        </div>
      </div>

      <Section id="about" title={dict.about.title}>
        <HomeAbout dict={dict} />
      </Section>

      <Section
        id="research"
        title={dict.home.research}
        action={{
          href: localePath(lang, ROUTES.research),
          label: dict.home.viewAll,
        }}
      >
        <HomeResearch themes={themes} locale={lang} dict={dict} />
      </Section>

      <Section
        id="projects"
        title={dict.home.projects}
        action={{
          href: localePath(lang, ROUTES.projects),
          label: dict.home.viewAll,
        }}
      >
        <HomeProjects
          projects={projects.slice(0, HOME_PROJECT_COUNT)}
          locale={lang}
        />
      </Section>

      <PartnerMarquee title={dict.home.partners} partners={PARTNERS} />

      <JoinSection recruit={recruit} dict={dict} locale={lang} />
    </>
  );
}
