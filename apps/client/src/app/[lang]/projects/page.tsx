import classNames from "classnames";
import type { Metadata } from "next";
import { PageHeader, ProjectBrowser } from "@/components/content";
import { ROUTES } from "@/constants";
import { hasLocale } from "@/i18n";
import { getDictionary } from "@/i18n/server";
import { getProjects, getThemes } from "@/libs/content";
import { localeAlternates } from "@/libs/seo";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/projects">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.projects.title,
    description: dict.projects.description,
    alternates: localeAlternates(lang, ROUTES.projects),
  };
}

/** 프로젝트 전체: 리서치 분야로 거르기 + 연도별 묶음 */
export default async function ProjectsPage({
  params,
}: PageProps<"/[lang]/projects">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return null;
  const [dict, themes, projects] = await Promise.all([
    getDictionary(lang),
    getThemes(),
    getProjects(),
  ]);

  return (
    <>
      <PageHeader title={dict.projects.title} />
      <div className={classNames("px-5 pt-10 pb-24 md:px-10 md:pt-14")}>
        <ProjectBrowser
          projects={projects}
          themes={themes.map(({ number, slug, title_ko, title_en }) => ({
            number,
            slug,
            title_ko,
            title_en,
          }))}
          locale={lang}
          dict={dict}
        />
      </div>
    </>
  );
}
