"use client";

import { type RefObject, useEffect, useState } from "react";

/**
 * 요소 가운데가 어떤 배경 위에 있는지 (에이전트 구를 밝은 구로 바꿀 때).
 * - "glow": [data-agent-glow] 상자(홈 첫 화면 — 보라 · 연보라 배경) → 밝은 구 + 넓은 흰 역광
 * - "dark": [data-header-tone="dark"] 상자(리서치 상세 이미지 등) · 푸터(#contact) → 밝은 구, 역광은 줄임
 * - null: 그 밖 (원래 구)
 * 스크롤 · 크기 바꿈 · 페이지 내용이 바뀔 때 다시 봅니다.
 */
export function useOverDark(ref: RefObject<HTMLElement | null>) {
  const [overDark, setOverDark] = useState<"glow" | "dark" | null>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      const inside = (selector: string) =>
        [...document.querySelectorAll(selector)].some((zone) => {
          const r = zone.getBoundingClientRect();
          return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
        });
      setOverDark(
        inside("[data-agent-glow]")
          ? "glow"
          : inside('[data-header-tone="dark"], #contact')
            ? "dark"
            : null,
      );
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
