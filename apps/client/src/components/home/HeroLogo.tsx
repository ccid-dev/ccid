"use client";

import classNames from "classnames";
import { motion, useReducedMotion } from "motion/react";

/**
 * 첫 화면 로고 모션 값.
 * startS: 화면이 뜬 뒤 시작까지 · staggerS: 글자 사이 간격 · durationS: 한 글자가 자리 잡는 시간 (모두 초)
 * 옆 타이핑은 HomeHero 의 TYPING.startMs 로 이 모션이 거의 끝날 때 시작하게 맞춥니다. (값을 바꾸면 거기도 같이)
 */
export const LOGO_MOTION = {
  startS: 0.2,
  staggerS: 0.08,
  durationS: 1.2,
};

/**
 * 홈 첫 화면의 큰 "cciD": 글자마다 차례로 아래에서 떠오르며 흐림 → 선명.
 * 화면 읽기 프로그램에는 한 단어로 읽힙니다. 움직임 줄이기 설정이면 바로 보입니다.
 */
export function HeroLogo({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <h1 className={className}>
      <span className={classNames("sr-only")}>{text}</span>
      <span aria-hidden>
        {[...text].map((letter, index) => (
          <motion.span
            // 글자는 바뀌지 않으므로 순서를 키로 씀
            key={index}
            className={classNames("inline-block")}
            initial={
              reduce ? false : { opacity: 0, y: "35%", filter: "blur(16px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              duration: LOGO_MOTION.durationS,
              delay: LOGO_MOTION.startS + index * LOGO_MOTION.staggerS,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {letter}
          </motion.span>
        ))}
      </span>
    </h1>
  );
}
