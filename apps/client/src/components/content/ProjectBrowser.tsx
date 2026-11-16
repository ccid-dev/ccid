"use client";

import classNames from "classnames";
import { useEffect, useState } from "react";
import { ThemeDot } from "@repo/common";
import { localized, type Dictionary, type Locale } from "@/i18n";
import type { ProjectWithThemes } from "@/libs/content";
import type { Theme } from "@/types";
import { ProjectList } from "./ProjectList";
import { GRID } from "./Section";

type ThemeOption = Pick<Theme, "number" | "slug" | "title_ko" | "title_en">;

/** 주소에서 고른 분야를 적는 이름: /projects?research=<분야 주소> */
const PARAM = "research";

/**
 * Projects 페이지: 리서치 분야로 거르기(컬러칩 버튼) + 연도별 묶음.
 * 고른 분야는 주소(?research=…)와 함께 움직여서 링크로 공유하고 뒤로 가기로 돌아갈 수 있습니다.
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

  // 주소 → 고른 분야 (처음 열 때 · 뒤로/앞으로 가기)
  useEffect(() => {
    const read = () => {
      const value = new URLSearchParams(window.location.search).get(PARAM);
      setSlug(themes.some((theme) => theme.slug === value) ? value : null);
    };
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, [themes]);

  /** 분야 고르기 → 주소에도 적기 (열려 있던 프로젝트 #slug 는 지움) */
  const select = (next: string | null) => {
    setSlug(next);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set(PARAM, next);
    else url.searchParams.delete(PARAM);
    window.history.pushState(null, "", url.pathname + url.search);
  };
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
      <div className={classNames(GRID)}>
        <div
          role="group"
          aria-label={dict.projects.filterLabel}
          className={classNames(
            "flex flex-wrap gap-2",
            "lg:col-span-7 lg:col-start-4",
          )}
        >
          <button
            type="button"
            aria-pressed={slug === null}
            onClick={() => select(null)}
            className={chip(slug === null)}
          >
            {dict.projects.all}
          </button>
          {themes.map((theme) => (
            <button
              key={theme.slug}
              type="button"
              aria-pressed={slug === theme.slug}
              onClick={() => select(slug === theme.slug ? null : theme.slug)}
              className={chip(slug === theme.slug)}
            >
              <ThemeDot number={theme.number} />
              {localized(theme, "title", locale)}
            </button>
          ))}
        </div>
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
              <div className={classNames("min-w-0 lg:col-span-7")}>
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
