import classNames from "classnames";
import { localized, type Dictionary, type Locale } from "@/i18n";
import type { Tables } from "@/types";
import { JoinButton } from "./JoinButton";
import { Section } from "./Section";

/**
 * Join: 모집 안내 구역. 문구 · 버튼 동작은 admin 의 Recruit 에서 관리합니다.
 * - 모집 중: 버튼이 지원 링크(새 창)
 * - 모집 중이 아님: 버튼을 누르면 안내 모달
 * 설정을 읽지 못하면 사전(dictionaries)의 문구 · 닫힘 상태로 보입니다.
 */
export function JoinSection({
  recruit,
  dict,
  locale,
}: {
  recruit: Tables<"recruit"> | null;
  dict: Dictionary;
  locale: Locale;
}) {
  const text = (
    field:
      | "eyebrow"
      | "title"
      | "description"
      | "cta"
      | "closed_title"
      | "closed_message",
    fallback: string,
  ) => (recruit ? localized(recruit, field, locale) : "") || fallback;

  return (
    <Section id="join" title={text("eyebrow", dict.join.eyebrow)}>
      {/* 검은 박스로 묶어 강조: 넓은 화면은 왼쪽 제목 · 설명, 오른쪽 아래 버튼 */}
      <div
        className={classNames(
          "flex flex-col gap-10 md:flex-row md:items-end md:justify-between",
          "p-8 md:p-12 lg:p-16",
          "rounded-3xl bg-gray-100 text-black",
        )}
      >
        <div className={classNames("max-w-2xl", "flex flex-col gap-4")}>
          <p
            className={classNames(
              "text-2xl leading-snug whitespace-pre-line break-keep md:text-3xl 2xl:text-4xl",
            )}
          >
            {text("title", dict.join.title)}
          </p>
          <p
            className={classNames(
              "text-base leading-7 whitespace-pre-line break-keep text-black/60",
            )}
          >
            {text("description", dict.join.description)}
          </p>
        </div>
        <JoinButton
          label={text("cta", dict.join.cta)}
          url={recruit?.apply_url ?? ""}
          open={Boolean(recruit?.is_open)}
          closed={{
            title: text("closed_title", dict.join.closedTitle),
            message: text("closed_message", ""),
            close: dict.project.close,
          }}
        />
      </div>
    </Section>
  );
}
