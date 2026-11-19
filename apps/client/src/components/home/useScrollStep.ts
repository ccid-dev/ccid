"use client";

import { type RefObject, useEffect } from "react";

/**
 * 스크롤로 항목이 하나씩 넘어가는 구역 (넓은 화면 1024px 이상에서만).
 * 구역(track)을 항목 수만큼 길게 만들고 안쪽을 화면에 고정(sticky)해 두면,
 * 구역을 지나가는 스크롤 진행도에 따라 지금 몇 번째 항목인지 onStep 으로 알려 줍니다.
 *
 * track 높이: 항목 수 × 한 칸 + 화면 높이  (예: lg:h-[calc(10*40svh+100svh)])
 * 좁은 화면에서는 아무것도 하지 않습니다. (그때는 탭 · 아코디언으로)
 */
export function useScrollStep(
  trackRef: RefObject<HTMLElement | null>,
  count: number,
  onStep: (index: number) => void,
) {
  useEffect(() => {
    const track = trackRef.current;
    if (!track || count < 2) return;
    const wide = window.matchMedia("(min-width: 1024px)");
    let raf = 0;
    let last = -1;

    const update = () => {
      raf = 0;
      if (!wide.matches) return;
      const box = track.getBoundingClientRect();
      const scrollable = box.height - window.innerHeight;
      if (scrollable <= 0) return;
      const progress = Math.min(1, Math.max(0, -box.top / scrollable));
      const index = Math.min(count - 1, Math.floor(progress * count));
      if (index !== last) {
        last = index;
        onStep(index);
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    wide.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      wide.removeEventListener("change", schedule);
    };
  }, [trackRef, count, onStep]);
}

/** 넓은 화면에서 track 안의 index 번째 항목 자리로 스크롤 (메뉴를 눌렀을 때) */
export function scrollToStep(
  track: HTMLElement | null,
  count: number,
  index: number,
) {
  if (!track || !window.matchMedia("(min-width: 1024px)").matches) return;
  const box = track.getBoundingClientRect();
  const scrollable = box.height - window.innerHeight;
  const top = window.scrollY + box.top + (scrollable * (index + 0.5)) / count;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
}
