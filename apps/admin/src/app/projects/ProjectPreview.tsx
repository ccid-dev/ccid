"use client";

import classNames from "classnames";
import { ProjectCard, ProjectDetail } from "@repo/blocks";
import {
  first,
  pickList,
  pickText,
  PreviewLink,
  PreviewScene,
  SITE_TEXT,
  type FormValues,
  type PreviewLang,
} from "@/components/preview";
import type { Theme } from "@/types";

export type PreviewTheme = Pick<
  Theme,
  | "id"
  | "number"
  | "slug"
  | "title_ko"
  | "title_en"
  | "summary_ko"
  | "summary_en"
>;

/** 사이트 Projects 에서 보이는 모습: 목록의 한 줄 카드 · 눌렀을 때 모달 */
export function ProjectPreview({
  values,
  lang,
  themes,
}: {
  values: FormValues;
  lang: PreviewLang;
  themes: PreviewTheme[];
}) {
  const text = SITE_TEXT[lang];
  const other = lang === "ko" ? "en" : "ko";
  const start = first(values, "year_start");
  const end = first(values, "year_end");
  const year = end && end !== start ? `${start}–${end}` : start;

  // 리서치 분야: 주 분야가 맨 앞 (저장할 때와 같은 순서)
  const ids = values.theme_ids ?? [];
  const primary = first(values, "primary_theme");
  const ordered = ids.includes(primary)
    ? [primary, ...ids.filter((id) => id !== primary)]
    : ids;
  const linked = ordered.flatMap((id) => {
    const theme = themes.find((t) => t.id === id);
    return theme ? [theme] : [];
  });

  const base = {
    year,
    title: pickText(values, "title", lang) || "제목 없음",
    client: pickText(values, "client", lang),
    description: pickText(values, "description", lang),
    nda: Boolean(first(values, "is_nda")),
  };

  return (
    <>
      <PreviewScene label="Projects 목록">
        <ProjectCard
          ndaLabel={text.nda}
          project={{ ...base, themeNumbers: linked.map((t) => t.number) }}
        />
      </PreviewScene>
      <PreviewScene label="눌렀을 때 (모달)">
        <div
          className={classNames(
            "max-w-5xl",
            "rounded-3xl bg-background shadow-xl ring-1 ring-black/5",
          )}
        >
          <ProjectDetail
            Link={PreviewLink}
            labels={text}
            project={{
              ...base,
              tags: pickList(values, "tags", lang),
              research: linked.map((theme) => ({
                number: theme.number,
                title: theme[`title_${lang}`] || theme[`title_${other}`],
                summary: theme[`summary_${lang}`] || theme[`summary_${other}`],
                href: `/research/${theme.slug}`,
              })),
            }}
          />
        </div>
      </PreviewScene>
    </>
  );
}
