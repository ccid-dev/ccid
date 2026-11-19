"use client";

import classNames from "classnames";
import { useEffect, useRef } from "react";

/** 다음 구역이 이만큼(px) 올라오는 동안 배지가 사라집니다. */
const FADE_DISTANCE = 160;
/** 버튼 지름 (px) */
const SIZE = 52;

/**
 * 홈 첫 화면 스크롤 안내 — 브라우저 맨 아래 가운데에 떠 있는 둥근 버튼(↓).
 *
 * 모션
 * - 등장: 첫 화면이 뜨고 조금 뒤, 아래에서 떠오르며 나타남
 * - 대기: 화살표가 위에서 떨어져 들어와 멈췄다 아래로 빠져나가기를 반복
 * - 올림: 버튼이 살짝 커지며 검정으로, 화살표가 흰색이 되고 더 빨리 떨어짐 · 누름: 살짝 눌림
 * - 스크롤: 다음 구역(targetId)이 올라오는 만큼 작아지고 흐려져 사라짐 (위로 오면 거꾸로)
 * - 움직임 줄이기 설정이면 반복 없이 나타나고 사라지기만 합니다.
 * 누르면 다음 구역으로 스크롤합니다.
 */
export function ScrollHint({
  targetId,
  label,
}: {
  /** 첫 화면 바로 다음 구역의 id */
  targetId: string;
  /** 스크린리더용 설명 (예: 아래로 스크롤) */
  label: string;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 스크롤 진행도(--p: 0 = 첫 화면만 보임, 1 = 다음 구역이 FADE_DISTANCE 만큼 올라옴)를 매 프레임 직접 씁니다.
  useEffect(() => {
    const target = document.getElementById(targetId);
    const button = buttonRef.current;
    if (!target || !button) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      // 첫 화면이 정확히 화면 높이라 맨 위에서는 다음 구역 윗변 = 화면 아래 끝 (2px 여유)
      const revealed =
        window.innerHeight - 2 - target.getBoundingClientRect().top;
      const p = Math.min(1, Math.max(0, revealed / FADE_DISTANCE));
      button.style.setProperty("--p", p.toFixed(3));
      const hidden = p > 0.6;
      button.style.pointerEvents = hidden ? "none" : "";
      button.tabIndex = hidden ? -1 : 0;
      button.setAttribute("aria-hidden", String(hidden));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [targetId]);

  const scrollToTarget = () => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    document
      .getElementById(targetId)
      ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={label}
      onClick={scrollToTarget}
      className={classNames(
        "group fixed bottom-6 left-1/2 z-30 md:bottom-8",
        "rounded-full text-main",
        "outline-offset-4 focus-visible:outline-2 focus-visible:outline-current",
      )}
      style={{
        width: SIZE,
        height: SIZE,
        // 스크롤 진행도에 따라: 흐려지고 · 내려가고 · 작아짐
        opacity: "calc(1 - var(--p, 0))",
        transform:
          "translateX(-50%) translateY(calc(var(--p, 0) * 24px)) scale(calc(1 - var(--p, 0) * 0.2))",
      }}
    >
      {/* 등장 */}
      <span
        className={classNames(
          "block size-full",
          "motion-safe:animate-scroll-hint-in",
        )}
      >
        {/* 올림 · 누름 */}
        <span
          className={classNames(
            "relative block size-full",
            "transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]",
            "group-hover:scale-108 group-active:scale-95 group-active:duration-150",
          )}
        >
          {/* 원 + ↓ (위에서 떨어져 들어와 아래로 빠져나감) */}
          <span
            aria-hidden
            className={classNames(
              "absolute inset-0",
              "flex items-center justify-center overflow-hidden",
              "rounded-full bg-sheet/70 backdrop-blur",
              "transition-colors duration-300 group-hover:bg-black group-hover:text-white",
            )}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={classNames(
                "size-4",
                "motion-safe:animate-scroll-hint-arrow group-hover:[animation-duration:1.1s]",
              )}
            >
              <path d="M8 2.5v11M3.5 9 8 13.5 12.5 9" />
            </svg>
          </span>
        </span>
      </span>
    </button>
  );
}
