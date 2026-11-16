import classNames from "classnames";
import Link from "next/link";
import { ThemeDot } from "@repo/common";
import { ROUTES } from "@/constants";
import { localePath, localized, type Locale } from "@/i18n";
import type { ProjectWithThemes } from "@/libs/content";

/** 프로젝트를 여는 링크 (Projects 페이지 + 모달) */
export const projectHref = (locale: Locale, project: ProjectWithThemes) =>
  `${localePath(locale, ROUTES.projects)}#${project.slug || project.id}`;

/**
 * 홈 Projects: 큰 글자 목록. 누르면 Projects 페이지로 가서 그 프로젝트 모달이 열립니다.
 */
export function HomeProjects({
  projects,
  locale,
}: {
  projects: ProjectWithThemes[];
  locale: Locale;
}) {
  return (
    <ul className={classNames("-mx-4 flex flex-col md:-mx-5")}>
      {projects.map((project) => (
        <li key={project.id}>
          <Link
            href={projectHref(locale, project)}
            className={classNames(
              "group grid gap-x-8 gap-y-1 md:grid-cols-[56px_minmax(0,1fr)_minmax(0,200px)_64px] md:items-baseline",
              "px-4 py-4 md:px-5",
              "rounded-2xl transition hover:bg-sheet/60",
            )}
          >
            <span
              className={classNames(
                "font-neuehaas text-sm font-medium text-sub",
              )}
            >
              {project.year_start}
            </span>
            <span
              className={classNames(
                "text-base leading-snug tracking-[-0.02em] break-keep md:text-xl",
              )}
            >
              {localized(project, "title", locale)}
            </span>
            <span className={classNames("truncate text-sm text-sub")}>
              {localized(project, "client", locale)}
            </span>
            <span
              className={classNames("flex items-center gap-1.5 md:justify-end")}
            >
              {project.themes.map((theme) => (
                <ThemeDot key={theme.slug} number={theme.number} />
              ))}
              <span
                aria-hidden
                className={classNames(
                  "hidden md:inline",
                  "ml-2",
                  "font-neuehaas text-sub transition group-hover:translate-x-1 group-hover:text-main",
                )}
              >
                →
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
