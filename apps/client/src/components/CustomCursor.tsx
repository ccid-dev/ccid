"use client";

import classNames from "classnames";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** 누를 수 있는 요소 (이 위에서는 원이 커집니다) */
const CLICKABLE =
  'a, button, [role="button"], summary, label, select, [cursor-label]';
/** 원 크기 (px) — 평소 · 누를 수 있는 요소 위 */
const SIZE = { base: 14, hover: 30 };
/** 따라오는 빠르기 (0–1, 클수록 마우스에 바로 붙음) */
const FOLLOW = 0.45;
/**
 * 스크롤할 때 원이 스크롤 방향으로 늘어나 물방울 알약이 되는 정도.
 * (머리 원 + 끌려가는 끝 원을 액체처럼 잇는 메타볼 모양)
 * pull: 스크롤 속도(px/프레임) 1 당 늘어나는 길이 · max: 최대 길이 (px)
 * tip: 다 늘어났을 때 끝 원의 크기 (머리 대비, 작을수록 물방울처럼 가늘게)
 * neck: 두 원을 잇는 목의 굵기 (0–1, 1 에 가까울수록 매끈한 알약)
 * follow: 머리가 끌려가는 쪽으로 같이 쏠리는 비율
 * spring · damping: 모양이 따라가는 탄성 (낮은 damping = 멈출 때 반대편으로 출렁)
 */
const MORPH = {
  pull: 1.4,
  max: 20,
  tip: 0.7,
  neck: 0.95,
  follow: 0.3,
  spring: 0.14,
  damping: 0.8,
};

type Point = [number, number];
const toward = ([x, y]: Point, angle: number, r: number): Point => [
  x + r * Math.cos(angle),
  y + r * Math.sin(angle),
];

/**
 * 두 원(c1 반지름 r1 · c2 반지름 r2) 사이를 액체처럼 잇는 목 부분 path (메타볼).
 * 두 원과 함께 칠하면 하나의 물방울 모양이 됩니다. 한 원이 다른 원 안에 있으면 빈 문자열.
 */
function metaballNeck(r1: number, r2: number, c1: Point, c2: Point, v: number) {
  const d = Math.hypot(c2[0] - c1[0], c2[1] - c1[1]);
  if (r1 <= 0 || r2 <= 0 || d <= Math.abs(r1 - r2)) return "";
  let u1 = 0;
  let u2 = 0;
  if (d < r1 + r2) {
    u1 = Math.acos((r1 * r1 + d * d - r2 * r2) / (2 * r1 * d));
    u2 = Math.acos((r2 * r2 + d * d - r1 * r1) / (2 * r2 * d));
  }
  const between = Math.atan2(c2[1] - c1[1], c2[0] - c1[0]);
  const spread = Math.acos((r1 - r2) / d);
  const a1 = between + u1 + (spread - u1) * v;
  const a2 = between - u1 - (spread - u1) * v;
  const a3 = between + Math.PI - u2 - (Math.PI - u2 - spread) * v;
  const a4 = between - Math.PI + u2 + (Math.PI - u2 - spread) * v;
  const p1 = toward(c1, a1, r1);
  const p2 = toward(c1, a2, r1);
  const p3 = toward(c2, a3, r2);
  const p4 = toward(c2, a4, r2);
  const handle =
    Math.min(v * 2.4, Math.hypot(p3[0] - p1[0], p3[1] - p1[1]) / (r1 + r2)) *
    Math.min(1, (d * 2) / (r1 + r2));
  const h1 = toward(p1, a1 - Math.PI / 2, r1 * handle);
  const h2 = toward(p2, a2 + Math.PI / 2, r1 * handle);
  const h3 = toward(p3, a3 + Math.PI / 2, r2 * handle);
  const h4 = toward(p4, a4 - Math.PI / 2, r2 * handle);
  const f = (p: Point) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
  return `M ${f(p1)} C ${f(h1)} ${f(h3)} ${f(p3)} A ${r2} ${r2} 0 ${d > r1 ? 1 : 0} 0 ${f(p4)} C ${f(h4)} ${f(h2)} ${f(p2)} Z`;
}

/**
 * 커스텀 커서 (마우스가 있는 화면에서만).
 * - 원 하나가 마우스를 부드럽게 따라옵니다. 바탕과 반전(mix-blend-difference)되어 글이 읽힙니다.
 * - 누를 수 있는 요소(a · button · role="button" …) 위에서는 원이 커집니다.
 * - cursor-label="설명" 이 있는 요소 위에서는 원 아래에 설명이 작게 뜹니다.
 * - 스크롤하면 원이 스크롤 반대편으로 늘어나 물방울 알약이 됩니다 (빠를수록 길게).
 *   세로 스크롤은 세로로, 좌우 스크롤(트랙패드 · 스와이퍼 등)은 가로로 늘어납니다.
 *   멈추면 다시 오므라들며 반대편으로 한 번 출렁이고 원으로 돌아옵니다.
 *   스크롤 중에는 스크롤 표현만 보여 주고(원은 기본 크기 · 설명 숨김),
 *   멈추면 그 자리의 요소를 다시 확인해 커짐 · 설명을 되살립니다.
 * 움직임 줄이기 설정이면 따라오는 지연 · 물방울 모양 없이 바로 움직입니다.
 * 모달(<dialog>)이 열려 있는 동안에는 커서를 최상위 층(popover)에 올려 모달 위에서도 보이게 합니다.
 *   (Safari 는 최상위 층에서 mix-blend 가 아래 페이지와 섞이지 않아서, 그동안은 반전 대신 검은 원으로)
 */
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hover, setHover] = useState(false);
  const [label, setLabel] = useState("");
  const [scrolling, setScrolling] = useState(false);
  /** 모달이 열려 있어 커서를 최상위 층에 올렸는지 */
  const [layered, setLayered] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<SVGCircleElement>(null);
  const tipRef = useRef<SVGCircleElement>(null);
  const neckRef = useRef<SVGPathElement>(null);
  /** 원의 기본 지름 (평소 · 누를 수 있는 요소 위) — 그리기 루프가 읽음 */
  const sizeRef = useRef<number>(SIZE.base);

  /** 최상위 층으로 (이미 올라가 있으면 다시 올려 새로 열린 모달보다 위로) */
  const raise = () => {
    const cursor = cursorRef.current;
    if (!cursor?.hasAttribute("popover") || !cursor.showPopover) return;
    if (cursor.matches(":popover-open")) cursor.hidePopover();
    cursor.showPopover();
  };

  // popover 가 붙은 직후 (그리기 전에) 최상위 층에 띄웁니다.
  useLayoutEffect(() => {
    if (layered) raise();
  }, [layered]);

  // 마우스가 있는 화면인지 (터치 기기에서는 쓰지 않음)
  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setEnabled(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("has-custom-cursor");

    // 모달(<dialog>)이 열리고 닫히는 것을 지켜보고, 열려 있는 동안만 커서를 최상위 층에 올립니다.
    const dialogs = new MutationObserver((records) => {
      const opened = records.some(
        (record) =>
          record.target instanceof HTMLDialogElement && record.target.open,
      );
      const anyOpen = Boolean(document.querySelector("dialog[open]"));
      setLayered(anyOpen);
      // 이미 올라가 있는데 모달이 또 열리면 그 위로 다시
      if (opened) raise();
    });
    dialogs.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["open"],
    });
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const target = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    /** 머리 반지름 · 끝 위치(머리 기준 x · y) 와 각각의 속도 — 용수철처럼 따라감 */
    const blob = { r: SIZE.base / 2, x: 0, y: 0 };
    const blobVel = { r: 0, x: 0, y: 0 };
    /** 스크롤 빠르기 (px/프레임, 부드럽게) */
    const scrollVel = { x: 0, y: 0 };
    /** 이번 프레임에 들어온 휠 · 트랙패드 이동량 (좌우 스크롤은 페이지가 안 움직이는 곳 — 스와이퍼 등 — 도 잡으려고) */
    const wheel = { x: 0, y: 0, used: false };
    let frameScrollY = window.scrollY;
    let frame = 0;
    const spring = (
      key: keyof typeof blob,
      goal: number,
      k: number,
      damp: number,
    ) => {
      if (reduce) {
        blob[key] = goal;
        return;
      }
      blobVel[key] = (blobVel[key] + (goal - blob[key]) * k) * damp;
      blob[key] += blobVel[key];
    };
    const loop = () => {
      const ease = reduce ? 1 : FOLLOW;
      pos.x += (target.x - pos.x) * ease;
      pos.y += (target.y - pos.y) * ease;
      if (cursorRef.current)
        cursorRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;

      // 스크롤 빠르기 (부드럽게): 세로는 휠 이동량 (없으면 페이지가 움직인 만큼 — 키보드 · 스크롤바), 가로는 휠 이동량
      const pageY = window.scrollY;
      const dy = wheel.used ? wheel.y : pageY - frameScrollY;
      scrollVel.x += (wheel.x - scrollVel.x) * 0.25;
      scrollVel.y += (dy - scrollVel.y) * 0.25;
      frameScrollY = pageY;
      wheel.x = 0;
      wheel.y = 0;
      wheel.used = false;

      // 끝이 끌려가는 곳: 스크롤 반대편 (아래로 스크롤 → 위로, 오른쪽으로 → 왼쪽으로), 빠를수록 멀리
      const speed = Math.hypot(scrollVel.x, scrollVel.y);
      const pull = Math.min(MORPH.max, speed * MORPH.pull);
      const goalX = speed > 0.01 ? (-scrollVel.x / speed) * pull : 0;
      const goalY = speed > 0.01 ? (-scrollVel.y / speed) * pull : 0;
      spring("r", sizeRef.current / 2, 0.2, 0.68);
      spring("x", goalX, MORPH.spring, MORPH.damping);
      spring("y", goalY, MORPH.spring, MORPH.damping);

      // 늘어날수록 머리는 살짝 작아지며 끌려가는 쪽으로 쏠리고, 끝은 가늘어짐 (부피가 옮겨 가는 느낌)
      const stretch = Math.min(1, Math.hypot(blob.x, blob.y) / MORPH.max);
      const r1 = blob.r * (1 - 0.1 * stretch);
      const r2 = r1 * (1 - (1 - MORPH.tip) * stretch);
      const c1: Point = [blob.x * MORPH.follow, blob.y * MORPH.follow];
      const c2: Point = [blob.x, blob.y];
      headRef.current?.setAttribute("cx", c1[0].toFixed(2));
      headRef.current?.setAttribute("cy", c1[1].toFixed(2));
      headRef.current?.setAttribute("r", r1.toFixed(2));
      tipRef.current?.setAttribute("cx", c2[0].toFixed(2));
      tipRef.current?.setAttribute("cy", c2[1].toFixed(2));
      tipRef.current?.setAttribute("r", r2.toFixed(2));
      neckRef.current?.setAttribute(
        "d",
        metaballNeck(r1, r2, c1, c2, MORPH.neck),
      );
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      setVisible(true);
    };
    /** 커서 아래 요소로 커짐 · 설명 정하기 */
    const inspect = (element: Element | null) => {
      setHover(Boolean(element?.closest(CLICKABLE)));
      setLabel(
        element?.closest("[cursor-label]")?.getAttribute("cursor-label") ?? "",
      );
    };
    const onOver = (event: PointerEvent) =>
      inspect(event.target instanceof Element ? event.target : null);
    const onLeave = () => setVisible(false);

    let lastY = window.scrollY;
    let timer = 0;
    const markScrolling = () => {
      setScrolling(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setScrolling(false);
        // 스크롤로 커서 아래 요소가 바뀌었을 수 있어서 다시 확인
        inspect(document.elementFromPoint(target.x, target.y));
      }, 160);
    };
    const onScroll = () => {
      if (reduce) return;
      const y = window.scrollY;
      if (y !== lastY) markScrolling();
      lastY = y;
    };
    // 휠 · 트랙패드 (스와이퍼처럼 이벤트를 막는 곳도 먼저 받으려고 capture)
    const onWheel = (event: WheelEvent) => {
      if (reduce) return;
      const unit =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? window.innerHeight
            : 1;
      wheel.x += event.deltaX * unit;
      wheel.y += event.deltaY * unit;
      wheel.used = true;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) markScrolling();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true, capture: true });
    return () => {
      root.classList.remove("has-custom-cursor");
      dialogs.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel, { capture: true });
    };
  }, [enabled]);

  // 스크롤 중에는 스크롤 표현만 (커짐 · 설명은 멈춘 뒤에)
  const size = hover && !scrolling ? SIZE.hover : SIZE.base;
  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  if (!enabled) return null;
  const showLabel = Boolean(label) && !scrolling;

  return (
    <div
      ref={cursorRef}
      aria-hidden
      // 모달이 열려 있을 때만 최상위 층용 popover (브라우저 기본 popover 모양은 아래 클래스로 지움)
      popover={layered ? "manual" : undefined}
      className={classNames(
        "size-0",
        // 맨 위층: 다른 떠 있는 패널(예: 튜닝 페이지의 Leva 패널 z 1000 · 색 선택기 z 10000)보다 위에 있어야
        // 그 위에서도 커서가 보입니다. (기본 커서는 숨겨져 있으므로)
        "pointer-events-none fixed inset-auto top-0 left-0 z-[100000] overflow-visible",
        "m-0 border-0 bg-transparent p-0",
        // 평소: 바탕과 반전 · 모달 위: 검은 원 (Safari 최상위 층에서는 반전이 안 됨)
        { "mix-blend-difference": !layered },
        "transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {/* 원 (스크롤하면 세로 물방울 알약) — 모양은 그리기 루프가 정함 */}
      {/* 크기가 0 인 svg 는 그려지지 않으므로, 커서 중심(0,0)을 가운데 둔 120px 캔버스 */}
      <svg
        viewBox="-60 -60 120 120"
        className={classNames(
          "absolute top-0 left-0 size-[120px] -translate-1/2 overflow-visible",
          layered ? "text-black" : "text-white",
        )}
      >
        <circle
          ref={headRef}
          cx="0"
          cy="0"
          r={SIZE.base / 2}
          fill="currentColor"
        />
        <circle ref={tipRef} cx="0" cy="0" r="0" fill="currentColor" />
        <path ref={neckRef} fill="currentColor" />
      </svg>
      {/* 설명 (cursor-label) */}
      <span
        style={{ transform: `translate(-50%, ${size / 2 + 10}px)` }}
        className={classNames(
          "absolute top-0 left-0",
          "transition-[opacity,transform] duration-200",
          [
            "font-neuehaas text-[11px] font-medium whitespace-nowrap",
            layered ? "text-main" : "text-white",
          ],
          showLabel ? "opacity-100" : "opacity-0",
        )}
      >
        {label}
      </span>
    </div>
  );
}
