import classNames from "classnames";
import { ThemeDot } from "@repo/common";
import {
  Pills,
  PlainLink,
  SiteImage,
  twoDigits,
  type SiteLink,
} from "./shared";

/** Research 목록의 분야 한 줄에 들어가는 값 (이미 고른 언어) */
export type ResearchCardData = {
  title: string;
  /** 한국어 화면에서 보조로 보이는 영문 제목 (없으면 비움) */
  subtitle: string;
  question: string;
  summary: string;
  keywords: string[];
  image: string | null;
  imageAlt: string;
  href: string;
};

/** Research 목록 왼쪽의 큰 번호 · 컬러칩. 칸 배치는 쓰는 쪽이 className 으로 정합니다. */
export function ResearchNumber({
  number,
  className,
}: {
  number: number;
  className?: string;
}) {
  return (
    <div
      className={classNames(
        "flex items-center gap-3 lg:items-start",
        className,
      )}
    >
      <span
        className={classNames(
          "font-neuehaas text-4xl leading-none font-medium tracking-[-0.04em] md:text-5xl",
        )}
      >
        {twoDigits(number)}
      </span>
      <ThemeDot number={number} size="lg" className={classNames("lg:mt-2")} />
    </div>
  );
}

/**
 * Research 목록의 분야 카드: 회색 면 안에 글(제목 · 질문 · 요약 · 키워드) · 대표 이미지.
 * 칸 배치는 쓰는 쪽이 className 으로 정합니다.
 */
export function ResearchCard({
  theme,
  moreLabel,
  className,
  Link = PlainLink,
}: {
  theme: ResearchCardData;
  moreLabel: string;
  className?: string;
  Link?: SiteLink;
}) {
  return (
    <Link
      href={theme.href}
      cursorLabel="Open"
      className={classNames(
        className,
        "grid gap-8 md:grid-cols-2 md:gap-12",
        "p-6 md:p-10",
        "rounded-3xl bg-sheet/60 transition hover:bg-sheet",
      )}
    >
      <span className={classNames("flex flex-col gap-6")}>
        <span>
          <span
            className={classNames(
              "block",
              "text-2xl leading-tight font-medium tracking-[-0.02em] break-keep md:text-3xl",
            )}
          >
            {theme.title}
          </span>
          {theme.subtitle ? (
            <span
              className={classNames(
                "block",
                "mt-1.5",
                "font-neuehaas text-sub",
              )}
            >
              {theme.subtitle}
            </span>
          ) : null}
        </span>
        <span
          className={classNames(
            "text-lg leading-8 whitespace-pre-line break-keep",
          )}
        >
          {theme.question}
        </span>
        <span className={classNames("text-sm leading-6 text-sub")}>
          {theme.summary}
        </span>
        {theme.keywords.length ? (
          <Pills items={theme.keywords} tone="white" />
        ) : null}
        <span
          className={classNames("mt-auto", "font-neuehaas text-sm font-medium")}
        >
          {moreLabel} →
        </span>
      </span>
      {theme.image ? (
        <SiteImage src={theme.image} alt={theme.imageAlt} />
      ) : null}
    </Link>
  );
}
