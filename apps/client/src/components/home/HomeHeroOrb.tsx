import classNames from "classnames";
import { InView } from "@/components/content";
import { HeroLogo } from "./HeroLogo";

/** 정식 명칭 */
const NAME = "Center for Creative Intelligence Design";
/**
 * 오른쪽 글이 아래에서 떠오르는 시점 (초).
 * nameS: 큰 "cciD." 글자들이 거의 자리 잡은 뒤 명칭 (HeroLogo 의 LOGO_MOTION 과 맞춤)
 * descriptionS: 명칭에 이어 한 박자 늦게 소개
 */
const FADE = {
  nameS: 1.1,
  descriptionS: 1.3,
};

/**
 * 홈 첫 화면 글자 (Figma "Frame 222", 1440px 화면 기준).
 * 왼쪽에 큰 그라디언트 글자 "cciD.", 오른쪽에 정식 명칭 · 소개(흰 글자).
 * 배경(진보라 그라디언트 · 큰 원)은 About 까지 함께 덮는 HomeGradientLayer 에 있습니다.
 * - 크기 · 위치는 1440px 디자인 값을 화면 폭 비율(vw)로 바꿔 씁니다. (글자 170px ≈ 11.8vw)
 * - 좁은 화면: 글자 → 명칭 · 소개 순서로 쌓음
 * 모션: 글자들이 차례로 선명해짐(HeroLogo) → 명칭 · 소개가 차례로 아래에서 페이드 인(InView)
 */
export function HomeHeroOrb({ description }: { description: string }) {
  return (
    <div
      className={classNames(
        "min-h-svh",
        // 글자 묶음을 화면(뷰포트) 아래쪽에 붙임: 화면이 낮거나 넓어도 아래로 밀려 잘리지 않음
        // (1440×900 에서 디자인과 같은 자리: 묶음 아래 96px). 위 여백은 헤더(72px)와 겹치지 않게
        "flex flex-col justify-end",
        // 아래 여백: 좁은 화면은 화면 아래 가운데 스크롤 안내(ScrollHint)와 겹치지 않게
        "px-5 pt-28 pb-32 md:px-10 md:pt-40 md:pb-24",
      )}
    >
      {/*
        글자 ↔ 명칭 간격: 디자인은 95px 지만 "cciD." 에 자간(-2.55px)을 넣지 않아 글자가 18px 넓으므로,
        명칭 시작이 디자인 자리(1440 기준 473px)에 오도록 77px(5.35vw)로 줄임
      */}
      <div
        className={classNames(
          "flex flex-col gap-6 md:flex-row md:items-center md:gap-[5vw]",
        )}
      >
        {/* 큰 로고: 흰색 → 연하늘 → 하늘색 그라디언트 글자, 글자들이 차례로 떠오르며 선명해짐 */}
        <HeroLogo
          text="cciD."
          className={classNames(
            "whitespace-nowrap",
            "font-neuehaas text-[22vw] leading-none md:text-[11.8vw]",
          )}
          letterClassName={classNames(
            "bg-linear-to-b from-white from-22% via-[#e3f0ff] via-70% to-[#5ea7ff] to-90% bg-clip-text",
            "text-transparent text-shadow-[0_0_4px_rgb(255_255_255/0.25)]",
          )}
        />
        <div className={classNames("max-w-100", "flex flex-col gap-3.5")}>
          {/* 명칭 → 소개: 차례로 아래에서 페이드 인 */}
          <InView
            y={12}
            delay={FADE.nameS}
            className={classNames(
              "font-neuehaas text-2xl leading-7 text-white",
            )}
          >
            <p>{NAME}</p>
          </InView>
          <InView
            y={12}
            delay={FADE.descriptionS}
            className={classNames(
              "text-[17px] leading-normal font-medium text-[#f1f1f1]",
            )}
          >
            <p>{description}</p>
          </InView>
        </div>
      </div>
    </div>
  );
}
