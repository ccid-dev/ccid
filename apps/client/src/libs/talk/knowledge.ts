import "server-only";

import { APP_INFO } from "@/config";
import { en } from "@/i18n/dictionaries/en";
import { ko } from "@/i18n/dictionaries/ko";
import {
  getPeopleGroups,
  getProjects,
  getRecruit,
  getThemes,
} from "@/libs/content";

/**
 * 에이전트가 아는 것 — 사이트에 이미 공개된 내용만. OpenAI 가 사이트를 직접 보는 것이 아니라,
 * 여기서 DB(공개된 행만) · 화면 문구를 글로 정리해 대화마다 함께 보냅니다.
 *
 * - admin 에서 고친 내용은 CACHE_MS 안에 반영됩니다.
 * - 글이 매번 똑같아야 OpenAI 의 프롬프트 캐시(같은 앞부분 할인)가 맞습니다. 그래서 순서를 고정하고,
 *   시각처럼 매번 바뀌는 값은 넣지 않습니다.
 * - NDA 프로젝트는 사이트처럼 기본 정보(연도 · 협력 기관 · 제목)만 넣습니다.
 * - 개인 연락처 · admin 전용 데이터는 넣지 않습니다.
 */

const CACHE_MS = 60_000;

const oneLine = (s: string | null | undefined) =>
  (s ?? "").replace(/\s*\n\s*/g, " ").trim();
const join = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(" · ");
const pair = (k: string, e: string) =>
  oneLine(k) === oneLine(e) ? oneLine(k) : join(oneLine(e), oneLine(k));

function aboutText(recruit: Awaited<ReturnType<typeof getRecruit>>) {
  const recruitLine = recruit
    ? recruit.is_open
      ? `- Recruiting now: ${pair(recruit.title_ko, recruit.title_en)}. ${pair(recruit.description_ko, recruit.description_en)}. The apply link is in the "${ko.join.cta}" / "${en.join.cta}" section on the People page.`
      : `- Not recruiting right now. ${pair(recruit.closed_message_ko, recruit.closed_message_en)}`
    : `- Joining: see the "${ko.join.cta}" / "${en.join.cta}" section on the People page. Dates and pay are not on the site.`;
  return `
## cciD
- Name: cciD, ${APP_INFO.fullName}. Founded in 2023 at Korea National University of Arts (한국예술종합학교).
- KO: ${ko.meta.description}
- EN: ${en.meta.description}
- KO: ${ko.about.lead} ${ko.about.body}
- EN: ${en.about.lead} ${en.about.body}
- What we do: ${en.about.capabilities.map((c) => c.name).join(", ")}.

## Contact and location
- Email: ${APP_INFO.email}
- Phone: ${APP_INFO.phone.label}
- Address: ${oneLine(APP_INFO.address.ko)} (${oneLine(APP_INFO.address.en)})

## Joining cciD
${recruitLine}

## Site pages (name them as they appear in the menu)
- Research: the research themes, each with its own page. Projects: every project by year. People: everyone at cciD, plus how to join. Lab: coming soon. About: on the home page.
`.trim();
}

async function themesText() {
  const themes = await getThemes();
  return themes
    .map((t) =>
      [
        `### ${String(t.number).padStart(2, "0")} ${pair(t.title_ko, t.title_en)}`,
        `- Question: ${pair(t.question_ko, t.question_en)}`,
        `- EN: ${oneLine(t.summary_en)} ${oneLine(t.description_en)}`,
        `- KO: ${oneLine(t.summary_ko)} ${oneLine(t.description_ko)}`,
        t.keywords_en.length > 0 && `- Focus: ${t.keywords_en.join(", ")}`,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");
}

async function projectsText() {
  const projects = await getProjects();
  return projects
    .map((p) => {
      const years =
        p.year_end && p.year_end !== p.year_start
          ? `${p.year_start}–${p.year_end}`
          : String(p.year_start);
      const head = join(
        years,
        pair(p.client_ko, p.client_en),
        pair(p.title_ko, p.title_en),
        p.themes.length > 0 &&
          `research: ${p.themes.map((t) => t.title_en).join(", ")}`,
      );
      if (p.is_nda) return `- ${head} (NDA: only these basics are public)`;
      const description = oneLine(p.description_en || p.description_ko);
      return `- ${head}${description ? `: ${description}` : ""}`;
    })
    .join("\n");
}

async function peopleText() {
  const groups = await getPeopleGroups();
  return groups
    .map((g) => {
      const people = g.people.map((p) => {
        const bio = oneLine(p.bio_en || p.bio_ko);
        const profile =
          g.category === "director"
            ? oneLine(p.profile_en || p.profile_ko)
            : "";
        return `- ${join(pair(p.name_ko, p.name_en), pair(p.role_ko, p.role_en))}${bio ? ` (${bio})` : ""}${profile ? `\n  Profile: ${profile}` : ""}`;
      });
      return [`### ${en.people.categories[g.category]}`, ...people].join("\n");
    })
    .join("\n\n");
}

async function build() {
  const [recruit, themes, projects, people] = await Promise.all([
    getRecruit(),
    themesText(),
    projectsText(),
    peopleText(),
  ]);
  return [
    aboutText(recruit),
    "## Research themes\n" + themes,
    "## Projects (newest first)\n" + projects,
    "## People\n" + people,
  ].join("\n\n");
}

let cached: { text: string; at: number } | null = null;
let pending: Promise<string> | null = null;

/** 에이전트에게 줄 사실 글. DB 를 못 읽으면 마지막으로 만든 글을 씁니다. */
export async function knowledge(): Promise<string> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.text;
  pending ??= build()
    .then((text) => {
      cached = { text, at: Date.now() };
      return text;
    })
    .catch((error: unknown) => {
      if (cached) {
        console.error("[talk/knowledge] keep last", String(error));
        return cached.text;
      }
      throw error;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}
