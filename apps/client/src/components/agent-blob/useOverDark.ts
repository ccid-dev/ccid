"use client";

import { type RefObject, useEffect, useState } from "react";

/**
 * 요소 가운데가 진한 배경 위에 있는지 (에이전트 구를 밝은 구로 바꿀 때).
 * 진한 배경 = 헤더 흰 글자 구역과 같은 [data-header-tone="dark"] 상자들 + [data-agent-glow] 상자(홈 첫 화면 전체) + 푸터(#contact, 진보라 단색).
 * 스크롤 · 크기 바꿈 · 페이지 내용이 바뀔 때 다시 봅니다.
 */
export function useOverDark(ref: RefObject<HTMLElement | null>) {
  const [overDark, setOverDark] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      const zones = document.querySelectorAll(
        '[data-header-tone="dark"], [data-agent-glow], #contact',
      );
      const dark = [...zones].some((zone) => {
        const r = zone.getBoundingClientRect();
        return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      });
      setOverDark(dark);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, [ref]);

  return overDark;
}
