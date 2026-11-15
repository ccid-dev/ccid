"use client";

import classNames from "classnames";
import { useState } from "react";
import { ThemeDot } from "@repo/common";
import { localized, type Dictionary, type Locale } from "@/i18n";
import type { ProjectWithThemes } from "@/libs/content";
import type { Theme } from "@/types";
import { ProjectList } from "./ProjectList";
import { GRID } from "./Section";

type ThemeOption = Pick<Theme, "number" | "slug" | "title_ko" | "title_en">;

/**
 * Projects 페이지: 리서치 분야로 거르기(컬러칩 버튼) + 연도별 묶음.
 */
export function ProjectBrowser({
  projects,
  themes,
  locale,
  dict,
}: {
  projects: ProjectWithThemes[];
  themes: ThemeOption[];
  locale: Locale;
  dict: Dictionary;
}) {
  const [slug, setSlug] = useState<string | null>(null);
  const shown = slug
    ? projects.filter((p) => p.themes.some((t) => t.slug === slug))
    : projects;
  const years = [...new Set(shown.map((p) => p.year_start))];

  const chip = (active: boolean) =>
    classNames(
      "h-9",
      "inline-flex items-center gap-2",
      "px-4",
      [
        "rounded-full transition",
        active ? "bg-black" : "bg-sheet/60 hover:bg-sheet",
      ],
      [
        "font-neuehaas text-sm font-medium whitespace-nowrap",
        active ? "text-white" : "text-main",
      ],
    );

  return (
    <div className={classNames("flex flex-col gap-8")}>
      <div
        role="group"
        aria-label={dict.projects.filterLabel}
        className={classNames(
          "flex flex-wrap gap-2",
          "lg:ml-[calc(25%+0.625rem)]",
        )}
      >
        <button
          type="button"
          aria-pressed={slug === null}
          onClick={() => setSlug(null)}
          className={chip(slug === null)}
        >
          {dict.projects.all}
        </button>
        {themes.map((theme) => (
          <button
            key={theme.slug}
            type="button"
            aria-pressed={slug === theme.slug}
            onClick={() => setSlug(slug === theme.slug ? null : theme.slug)}
            className={chip(slug === theme.slug)}
          >
            <ThemeDot number={theme.number} />
            {localized(theme, "title", locale)}
          </button>
        ))}
      </div>

      {years.length ? (
        <div className={classNames("flex flex-col gap-16 md:gap-20")}>
          {years.map((year) => (
            <section key={year} className={classNames(GRID, "gap-y-4")}>
              <h2
                className={classNames(
                  "self-start lg:sticky lg:top-24 lg:col-span-3",
                  "font-neuehaas text-2xl leading-none font-medium tracking-[-0.02em]",
                )}
              >
                {year}
              </h2>
              <div className={classNames("min-w-0 lg:col-span-9")}>
                <ProjectList
                  projects={shown.filter(
                    (project) => project.year_start === year,
                  )}
                  locale={locale}
                  dict={dict}
                  showYear={false}
                />
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className={classNames("text-sm text-sub")}>{dict.project.empty}</p>
      )}
    </div>
  );
}
