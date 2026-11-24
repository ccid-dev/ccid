"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * 헤더 뒤가 진한 색이면 헤더에 data-tone="dark" 를 붙입니다. (화면에는 아무것도 그리지 않음)
 * - 진한 구역: 페이지 안의 [data-header-tone="dark"] 상자 (지금은 홈 첫 화면의 보라 부분)
 * - 헤더 가운데 높이선이 그 상자 안에 있으면 dark → 헤더 쪽은 group-data-[tone=dark]/header: 로 흰 글자
 * - 모바일 메뉴가 열려 있으면(햄버거 aria-expanded) 흰 바탕이 덮으므로 dark 를 뗍니다.
 */
export function HeaderTone() {
  const ref = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const header = ref.current?.closest("header");
    if (!header) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const line = header.offsetHeight / 2;
      const menuOpen = header.querySelector('[aria-expanded="true"]');
      const dark =
        !menuOpen &&
        [...document.querySelectorAll('[data-header-tone="dark"]')].some(
          (zone) => {
            const rect = zone.getBoundingClientRect();
            return rect.top <= line && rect.bottom > line;
          },
        );
      if (dark) header.dataset.tone = "dark";
      else delete header.dataset.tone;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // 다시 계산할 때: 메뉴 열고 닫기(스크롤이 막혀 있어 scroll 로는 알 수 없음) ·
    // 페이지 내용이 나중에 도착할 때 (헤더가 먼저 붙고 첫 화면은 뒤따라 그려짐)
    const observer = new MutationObserver(schedule);
    observer.observe(header, {
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-expanded"],
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
    // 페이지가 바뀌면 진한 구역도 바뀌므로 다시 계산
  }, [pathname]);

  return <span ref={ref} hidden />;
}
