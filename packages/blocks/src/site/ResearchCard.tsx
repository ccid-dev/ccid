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
          "font-neuehaas text-4xl leading-none md:text-5xl",
        )}
      >
        {twoDigits(number)}
      </span>
      <ThemeDot number={number} size="lg" className={classNames("lg:mt-2")} />
    </div>
  );
}

/**
 * Research 목록의 분야 카드: 회색 면 안에 글 · 대표 이미지. 칸 배치는 쓰는 쪽이 className 으로 정합니다.
 * 글은 세 덩어리로 묶습니다 (덩어리 안은 붙이고, 덩어리 사이는 크게 띄움):
 *   ① 제목(크게, 보통 굵기) + 영문 부제  ② 질문 + 요약  ③ 키워드 + 자세히 보기 (맨 아래)
 * 모션: 마우스를 올리면 바탕이 진해지고, 이미지가 살짝 확대되며, 화살표가 밀립니다.
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
        "group grid gap-10 md:grid-cols-2 md:gap-12",
        "p-6 md:p-12 2xl:p-16",
        "rounded-3xl bg-sheet/60 transition-colors duration-300 hover:bg-sheet",
      )}
    >
      <span className={classNames("flex flex-col gap-10 md:gap-14")}>
        {/* ① 제목 + 영문 부제 */}
        <span className={classNames("flex flex-col gap-2")}>
          <span
            className={classNames(
              "text-3xl leading-tight break-keep md:text-4xl 2xl:text-5xl",
            )}
          >
            {theme.title}
          </span>
          {theme.subtitle ? (
            <span className={classNames("font-neuehaas text-sm text-sub")}>
              {theme.subtitle}
            </span>
          ) : null}
        </span>
        {/* ② 질문 + 요약 */}
        <span className={classNames("flex flex-col gap-3")}>
          <span
            className={classNames(
              "text-lg leading-8 font-medium whitespace-pre-line break-keep 2xl:text-2xl 2xl:leading-10",
            )}
          >
            {theme.question}
          </span>
          <span
            className={classNames(
              "text-sm leading-6 text-sub 2xl:text-base 2xl:leading-7",
            )}
          >
            {theme.summary}
          </span>
        </span>
        {/* ③ 키워드 + 자세히 보기 (맨 아래) */}
        <span className={classNames("mt-auto flex flex-col gap-5")}>
          {theme.keywords.length ? (
            <Pills items={theme.keywords} tone="white" />
          ) : null}
          <span
            className={classNames(
              "inline-flex items-center gap-1.5",
              "font-neuehaas text-sm font-medium",
            )}
          >
            {moreLabel}
            <span
              aria-hidden
              className={classNames(
                "transition-transform duration-300 group-hover:translate-x-1",
              )}
            >
              →
            </span>
          </span>
        </span>
      </span>
      {theme.image ? (
        <span
          className={classNames(
            "block overflow-hidden rounded-2xl",
            "[&_img]:transition-transform [&_img]:duration-700 [&_img]:ease-[cubic-bezier(.22,1,.36,1)] group-hover:[&_img]:scale-105",
          )}
        >
          <SiteImage src={theme.image} alt={theme.imageAlt} />
        </span>
      ) : null}
    </Link>
  );
}
