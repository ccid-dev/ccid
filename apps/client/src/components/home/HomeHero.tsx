import classNames from "classnames";
import type { ReactNode } from "react";
import { InView, TypedText } from "@/components/content";
import { HeroLogo } from "./HeroLogo";

/** 정식 명칭 */
const NAME = "Center for Creative Intelligence Design";
/**
 * 첫 화면: 정식 명칭은 한 글자씩 타이핑 → (잠깐 쉬고) 소개는 아래에서 페이드 인.
 * startMs: 화면이 뜬 뒤 시작까지 · nameKeyMs: 한 글자 간격 · pauseMs: 이름을 다 쓴 뒤 소개가 떠오르기까지 쉼
 */
const TYPING = {
  // 큰 "cciD." 글자들이 거의 자리 잡은 뒤 시작 (HeroLogo 의 LOGO_MOTION 과 맞춤)
  startMs: 1300,
  nameKeyMs: 45,
  pauseMs: 300,
};

/**
 * 홈 첫 화면: 아래에 큰 "cciD" (화면 폭에 비례해 커짐), 바로 오른쪽 글자 윗선에 정식 명칭 · 소개.
 * 글자와 설명이 붙어 있어 큰 화면에서도 한 덩어리로 읽힙니다. 좁은 화면은 설명 → 글자 순서로 쌓임.
 * 홈과 /hero-tune 이 같이 씁니다. 배경은 background 로 넣습니다. (HeroBackground)
 * 정식 명칭은 타이핑되고, 다 쓰면 소개가 아래에서 페이드 인 됩니다. (TYPING)
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
        "flex flex-col justify-center",
        "px-5 md:px-10",
        // 아래쪽 여백: 좁은 화면에서는 화면 아래 가운데의 스크롤 안내(ScrollHint)와 글이 겹치지 않도록 넉넉히
        "pt-24 pb-32 lg:pb-14",
      )}
    >
      {background}
      <div
        className={classNames(
          "w-full h-fit",
          "flex flex-col-reverse gap-8",
          "md:flex-row justify-center md:items-center md:gap-12",
          "",
        )}
      >
        {/* 큰 로고: 글자들이 차례로 떠오르며 선명해짐 (HeroLogo) → 이어서 옆 글이 타이핑됨 */}
        <HeroLogo
          text="cciD."
          className={classNames(
            "font-neuehaas text-[20vw] leading-none whitespace-nowrap md:text-[9vw]",
          )}
        />
        <div className={classNames("max-w-md ", "flex flex-col gap-3")}>
          <p
            className={classNames(
              "font-neuehaas text-lg font-medium 2xl:text-xl",
            )}
          >
            <TypedText
              text={NAME}
              delay={TYPING.startMs}
              keyDelay={TYPING.nameKeyMs}
            />
          </p>
          {/* 소개: 이름 타이핑이 끝나면 아래에서 페이드 인 (타이핑이 너무 많지 않게) */}
          <InView
            y={12}
            delay={
              (TYPING.startMs +
                NAME.length * TYPING.nameKeyMs +
                TYPING.pauseMs) /
              1000
            }
            className={classNames(
              "text-sm md:text-base 2xl:text-lg",
              "leading-snug break-keep text-sub",
            )}
          >
            <p>{description}</p>
          </InView>
        </div>
      </div>
    </div>
  );
}
