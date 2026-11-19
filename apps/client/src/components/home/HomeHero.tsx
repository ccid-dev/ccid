import classNames from "classnames";
import type { ReactNode } from "react";

/**
 * 홈 첫 화면: 아래에 큰 "cciD" (화면 폭에 비례해 커짐), 바로 오른쪽 글자 윗선에 정식 명칭 · 소개.
 * 글자와 설명이 붙어 있어 큰 화면에서도 한 덩어리로 읽힙니다. 좁은 화면은 설명 → 글자 순서로 쌓임.
 * 홈과 /hero-tune 이 같이 씁니다. 배경은 background 로 넣습니다. (HeroBackground)
 */
export function HomeHero({
  description,
  background,
}: {
  description: string;
  background?: ReactNode;
}) {
  return (
    <div
      className={classNames(
        "relative isolate min-h-[100svh]",
        "flex flex-col justify-end",
        "px-5 md:px-10",
        // 아래쪽 여백: 좁은 화면에서는 화면 아래 가운데의 스크롤 안내(ScrollHint)와 글이 겹치지 않도록 넉넉히
        "pt-24 pb-32 lg:pb-14",
      )}
    >
      {background}
      <div
        className={classNames(
          "flex flex-col-reverse gap-8",
          "md:flex-row md:items-start md:gap-12",
        )}
      >
        <h1
          className={classNames(
            "font-neuehaas text-[20vw] leading-[0.8] whitespace-nowrap md:text-[18vw]",
          )}
        >
          cciD
        </h1>
        <div
          className={classNames(
            "max-w-md md:pt-[1.5vw]",
            "flex flex-col gap-3",
          )}
        >
          <p
            className={classNames(
              "font-neuehaas text-lg font-medium 2xl:text-xl",
            )}
          >
            Center for Creative Intelligence Design
          </p>
          <p
            className={classNames(
              "text-sm md:text-base 2xl:text-lg",
              "leading-snug break-keep text-sub",
            )}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
