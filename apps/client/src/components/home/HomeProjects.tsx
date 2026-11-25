import classNames from "classnames";
import Link from "next/link";
import { themeGlow } from "@repo/blocks";
import { Reveal } from "@/components/content";
import { ROUTES } from "@/constants";
import { localePath, localized, type Locale } from "@/i18n";
import type { ProjectWithThemes } from "@/libs/content";

/** 프로젝트를 여는 링크 (Projects 페이지 + 모달) */
export const projectHref = (locale: Locale, project: ProjectWithThemes) =>
  `${localePath(locale, ROUTES.projects)}#${project.slug || project.id}`;

/**
 * 홈 Projects: 큰 글자 목록. 누르면 Projects 페이지로 가서 그 프로젝트 모달이 열립니다.
 * 넓은 화면에서는 내용 8칸에 맞춥니다: 연도 1 · 제목(+ 아래 회사명) 6 · 화살표 1.
 * 모션: 화면에 들어올 때 위에서부터 차례로 떠오르고, 한 줄에 마우스를 올리면 그 줄에 분야 색 그라데이션이 번지고 나머지 줄이 흐려집니다.
 */
export function HomeProjects({
  projects,
  locale,
}: {
  projects: ProjectWithThemes[];
  locale: Locale;
}) {
  return (
    <ul className={classNames("group/list -mx-4 flex flex-col md:-mx-5")}>
      {projects.map((project, index) => {
        // 호버: 속한 분야 색 radial 그라데이션 (여러 분야면 색이 조합됨)
        const glow = themeGlow(project.themes.map((theme) => theme.number));
        return (
        <li key={project.id}>
          <Reveal delay={index * 60}>
            <Link
              href={projectHref(locale, project)}
              cursor-label="View"
              className={classNames(
                "group grid gap-x-8 gap-y-1 md:grid-cols-[56px_minmax(0,1fr)_64px] md:items-baseline",
                "lg:grid-cols-8 lg:gap-x-10",
                "px-4 py-4 md:px-5",
                // isolate: 호버 그라데이션(-z-10)이 글 아래에 깔리게
                "relative isolate overflow-hidden rounded-2xl",
                // 다른 줄 흐리게 (보고 있는 줄은 그대로)
                "group-hover/list:opacity-40 hover:opacity-100! focus-visible:opacity-100!",
              )}
            >
              {glow ? (
                <span
                  aria-hidden
                  style={{ backgroundImage: glow }}
                  className={classNames(
                    "pointer-events-none absolute inset-0 -z-10 rounded-[inherit]",
                    "opacity-0 transition-opacity duration-500 group-hover:opacity-100",
                    "shadow-[inset_-22px_-15px_16px_rgb(255_255_255/0.25),inset_42px_40px_3px_rgb(255_255_255/0.25),inset_0_-59px_100px_rgb(255_255_255/0.25)]",
                  )}
                />
              ) : null}
              <span
                className={classNames(
                  "font-neuehaas text-sm font-medium text-sub",
                )}
              >
                {project.year_start}
              </span>
              {/* 제목 + 바로 아래 회사명 (한 덩어리로 읽히도록) */}
              <span className={classNames("flex flex-col gap-1 lg:col-span-6")}>
                <span
                  className={classNames(
                    "text-lg leading-snug break-keep md:text-xl",
                  )}
                >
                  {localized(project, "title", locale)}
                </span>
                <span className={classNames("truncate text-sm text-sub")}>
                  {localized(project, "client", locale)}
                </span>
              </span>
              {/* 좁은 화면은 줄 전체가 눌리는 걸로 충분해 화살표를 숨김 */}
              <span
                aria-hidden
                className={classNames(
                  "hidden md:block",
                  "transition group-hover:translate-x-1",
                  "text-right font-neuehaas text-sub group-hover:text-main",
                )}
              >
                →
              </span>
            </Link>
          </Reveal>
        </li>
        );
      })}
    </ul>
  );
}
