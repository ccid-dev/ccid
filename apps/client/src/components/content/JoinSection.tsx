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
      <div className={classNames("max-w-4xl", "flex flex-col gap-6")}>
        <p
          className={classNames(
            "text-xl leading-snug font-medium tracking-[-0.02em] whitespace-pre-line break-keep md:text-2xl md:leading-[1.3]",
          )}
        >
          {text("title", dict.join.title)}
        </p>
        <p
          className={classNames(
            "leading-7 whitespace-pre-line break-keep text-sub",
          )}
        >
          {text("description", dict.join.description)}
        </p>
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
