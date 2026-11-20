"use client";

import classNames from "classnames";
import { useReducedMotion } from "motion/react";
import { TypeAnimation } from "react-type-animation";

/**
 * 한 글자씩 타이핑되며 나타나는 글 (react-type-animation).
 * 다 쓴 글의 자리를 투명하게 미리 잡아 두어서, 타이핑하는 동안 줄이 늘어나며 아래 · 옆 요소가 밀리지 않습니다.
 * 화면 읽기 프로그램에는 처음부터 전체 글을 읽어 줍니다. 움직임 줄이기 설정이면 바로 다 보입니다.
 */
export function TypedText({
  text,
  delay = 0,
  keyDelay = 40,
  cursor = false,
  className,
}: {
  text: string;
  /** 타이핑을 시작하기 전 기다리는 시간 (ms) — 여러 줄을 차례로 쓰려면 앞 줄이 끝나는 시간만큼 */
  delay?: number;
  /** 한 글자 쓰는 간격 (ms) */
  keyDelay?: number;
  /** 다 쓴 뒤 깜빡이는 커서 */
  cursor?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <span className={classNames("grid", className)}>
      <span className={classNames("sr-only")}>{text}</span>
      {/* 다 쓴 글의 자리 (보이지 않음) */}
      <span
        aria-hidden
        className={classNames("invisible col-start-1 row-start-1")}
      >
        {text}
      </span>
      {reduce ? (
        <span aria-hidden className={classNames("col-start-1 row-start-1")}>
          {text}
        </span>
      ) : (
        <TypeAnimation
          aria-hidden
          wrapper="span"
          className={classNames("col-start-1 row-start-1")}
          sequence={[delay, text]}
          speed={{ type: "keyStrokeDelayInMs", value: keyDelay }}
          cursor={cursor}
        />
      )}
    </span>
  );
}
