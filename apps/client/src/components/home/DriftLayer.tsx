"use client";

import classNames from "classnames";
import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";

/** 한 바퀴 동안 지나는 자세들. 모든 배열은 같은 길이로, 처음 = 끝이 되게 (이어서 반복) */
export type DriftFrames = {
  /** 좌우 이동 (자기 폭 대비 %) */
  x?: readonly number[];
  /** 위아래 이동 (자기 높이 대비 %) */
  y?: readonly number[];
  /** 회전 (도) */
  rotate?: readonly number[];
  /** 크기 배율 */
  scale?: readonly number[];
  /** 투명도 */
  opacity?: readonly number[];
};

/**
 * 부드러운 그라디언트 덩어리 하나가 천천히 흘러다니는 층 (홈 배경 모션 공용).
 * - 움직임은 transform 문자열 하나 + opacity 만 씁니다. motion 은 이 둘을 브라우저의 Web Animations 로 넘겨
 *   GPU 합성 단계에서 돌리므로 자바스크립트가 매 프레임 일하지 않습니다. (x · y · scale 속성으로 주면 매 프레임 자바스크립트로 스타일을 바꿔 무거움)
 * - 그라디언트 자체가 부드러워 blur 필터가 필요 없습니다. (filter: blur 는 움직이는 큰 면에 쓰면 가장 무거움)
 * - 움직임 줄이기 설정이면 첫 자세에 멈춘 채 보입니다.
 * - className 에 배경(그라디언트)을, style 에 자리 · 크기를 넣습니다. (덩어리마다 다른 값)
 */
export function DriftLayer({
  frames,
  seconds,
  delay = 0,
  className,
  style,
}: {
  frames: DriftFrames;
  /** 한 바퀴 (초) */
  seconds: number;
  /** 시작 늦춤 (초) — 덩어리마다 다르게 해 박자가 어긋나게 */
  delay?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const reduce = useReducedMotion();
  const count = Math.max(
    frames.x?.length ?? 0,
    frames.y?.length ?? 0,
    frames.rotate?.length ?? 0,
    frames.scale?.length ?? 0,
    frames.opacity?.length ?? 0,
  );
  const at = (list: readonly number[] | undefined, i: number, rest: number) =>
    list?.[i] ?? rest;
  const transforms = Array.from(
    { length: count },
    (_, i) =>
      `translate3d(${at(frames.x, i, 0)}%, ${at(frames.y, i, 0)}%, 0) rotate(${at(frames.rotate, i, 0)}deg) scale(${at(frames.scale, i, 1)})`,
  );

  return (
    <motion.div
      aria-hidden
      className={classNames("absolute", className)}
      style={style}
      initial={{
        transform: transforms[0],
        ...(frames.opacity ? { opacity: frames.opacity[0] } : {}),
      }}
      animate={
        reduce
          ? undefined
          : {
              transform: transforms,
              ...(frames.opacity ? { opacity: [...frames.opacity] } : {}),
            }
      }
      transition={{
        duration: seconds,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}
