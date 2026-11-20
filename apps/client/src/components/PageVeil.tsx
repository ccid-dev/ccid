"use client";

import classNames from "classnames";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * 페이지 전환 유리 베일 값 — 여기서 조절합니다.
 * blur: 유리의 흐림 (px) · coverMs: 내려앉는 시간 · revealMs: 걷히는 시간
 * minMs: 빨리 와도 최소한 덮고 있는 시간
 * maxMs: 이동이 안 일어나도 이 시간이 지나면 걷음 (안전장치)
 */
const VEIL = {
  blur: 24,
  coverMs: 300,
  revealMs: 700,
  minMs: 250,
  maxMs: 8000,
};

type Phase = "idle" | "cover" | "reveal";

/** 같은 사이트의 다른 페이지로 가는 링크인지 (새 창 · 다운로드 · 같은 페이지 안 #이동 · ?만 바뀌는 이동은 제외) */
function isPageLink(event: MouseEvent): boolean {
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return false;
  const anchor =
    event.target instanceof Element
      ? event.target.closest<HTMLAnchorElement>("a[href]")
      : null;
  if (!anchor) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  return url.pathname !== window.location.pathname;
}

/**
 * 페이지 전환 모션 (유리 베일).
 * 1) 다른 페이지 링크를 누르면 지금 화면 위로 젖빛 유리가 내려앉으며 흐려지고 (가장자리에 브랜드 색이 살짝 번짐)
 * 2) 새 페이지가 다 그려지면 (loading.tsx 화면이 사라지면) 유리가 걷히며 선명해집니다.
 * 덮여 있는 동안에는 <html data-veil="on"> 이 붙습니다. (그동안 다르게 보여야 할 것이 있으면 in-data-[veil=on]: 로)
 * 움직임 줄이기 설정이면 쓰지 않습니다.
 */
export function PageVeil() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const startRef = useRef(0);
  const fromRef = useRef(pathname);

  // 링크 클릭 → 덮기 (Next Link 가 기본 동작을 막기 전에 받으려고 capture)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onClick = (event: MouseEvent) => {
      if (!isPageLink(event)) return;
      startRef.current = performance.now();
      fromRef.current = window.location.pathname;
      setPhase("cover");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // 덮여 있는 동안: 안전장치 · <html data-veil="on"> 표시
  useEffect(() => {
    if (phase !== "cover") return;
    const root = document.documentElement;
    root.dataset.veil = "on";
    const safety = window.setTimeout(() => setPhase("reveal"), VEIL.maxMs);
    return () => {
      window.clearTimeout(safety);
      delete root.dataset.veil;
    };
  }, [phase]);

  // 새 페이지로 바뀌고, 불러오는 화면(loading.tsx)까지 사라지면 → 걷기
  useEffect(() => {
    if (phase !== "cover" || pathname === fromRef.current) return;
    let raf = 0;
    let timer = 0;
    const wait = () => {
      if (document.querySelector("[data-page-loading]")) {
        raf = requestAnimationFrame(wait);
        return;
      }
      const left = VEIL.minMs - (performance.now() - startRef.current);
      timer = window.setTimeout(() => setPhase("reveal"), Math.max(0, left));
    };
    raf = requestAnimationFrame(wait);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [pathname, phase]);

  // 다 걷히면 쉬기
  useEffect(() => {
    if (phase !== "reveal") return;
    const timer = window.setTimeout(() => {
      setPhase("idle");
    }, VEIL.revealMs);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const covered = phase === "cover";
  const blur = phase === "idle" ? "none" : `blur(${covered ? VEIL.blur : 0}px)`;

  return (
    <div
      aria-hidden={!covered}
      style={{
        transitionDuration: `${covered ? VEIL.coverMs : VEIL.revealMs}ms`,
        backdropFilter: blur,
        WebkitBackdropFilter: blur,
      }}
      className={classNames(
        "fixed inset-0 z-[95]",
        "transition-[opacity,backdrop-filter,background-color] ease-[cubic-bezier(.22,1,.36,1)]",
        covered
          ? "pointer-events-auto bg-white/30 opacity-100"
          : "pointer-events-none bg-white/0 opacity-0",
      )}
    >
      {/* 가장자리에 번지는 브랜드 색 (유리 안쪽 빛) */}
      <span
        aria-hidden
        className={classNames(
          "absolute inset-0",
          "bg-[radial-gradient(60%_50%_at_0%_0%,rgba(199,158,255,0.28),transparent),radial-gradient(55%_50%_at_100%_100%,rgba(104,215,255,0.22),transparent),radial-gradient(45%_40%_at_100%_0%,rgba(251,179,152,0.18),transparent)]",
        )}
      />
    </div>
  );
}
