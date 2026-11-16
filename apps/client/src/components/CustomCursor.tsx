"use client";

import classNames from "classnames";
import { useEffect, useRef, useState } from "react";

/** 누를 수 있는 요소 (이 위에서는 원이 커집니다) */
const CLICKABLE =
  'a, button, [role="button"], summary, label, select, [cursor-label]';
/** 원 크기 (px) — 평소 · 누를 수 있는 요소 위 */
const SIZE = { base: 14, hover: 30 };
/** 따라오는 빠르기 (0–1, 클수록 마우스에 바로 붙음) */
const FOLLOW = 0.45;
/** 스크롤할 때 따라붙는 작은 원 두 개: 원 가장자리에서 떨어진 거리 (px) · 크기 */
const TRAIL = [
  { gap: 7, size: 9 },
  { gap: 19, size: 6 },
];

/**
 * 커스텀 커서 (마우스가 있는 화면에서만).
 * - 원 하나가 마우스를 부드럽게 따라옵니다. 바탕과 반전(mix-blend-difference)되어 글이 읽힙니다.
 * - 누를 수 있는 요소(a · button · role="button" …) 위에서는 원이 커집니다.
 * - cursor-label="설명" 이 있는 요소 위에서는 원 아래에 설명이 작게 뜹니다.
 * - 스크롤하면 작은 원 두 개가 세로로 붙습니다. 아래로 스크롤하면 위에, 위로 스크롤하면 아래에.
 *   스크롤 중에는 스크롤 표현만 보여 주고(원은 기본 크기 · 설명 숨김),
 *   멈추면 그 자리의 요소를 다시 확인해 커짐 · 설명을 되살립니다.
 * 움직임 줄이기 설정이면 따라오는 지연 · 스크롤 원 없이 바로 움직입니다.
 * 모달(<dialog>) 위에서도 보이도록 커서를 최상위 층(popover)에 둡니다.
 */
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hover, setHover] = useState(false);
  const [label, setLabel] = useState("");
  const [scroll, setScroll] = useState<"up" | "down" | null>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

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

    // 커서를 최상위 층(top layer)에 올립니다. 모달(<dialog>)도 최상위 층에 뜨기 때문에,
    // 모달이 열릴 때마다 커서를 다시 올려 모달 위에서도 보이게 합니다.
    const cursor = cursorRef.current;
    const raise = () => {
      if (!cursor || typeof cursor.showPopover !== "function") return;
      if (cursor.matches(":popover-open")) cursor.hidePopover();
      cursor.showPopover();
    };
    raise();
    const dialogs = new MutationObserver((records) => {
      if (
        records.some(
          (record) =>
            record.target instanceof HTMLDialogElement && record.target.open,
        )
      )
        raise();
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
    let frame = 0;
    const loop = () => {
      const ease = reduce ? 1 : FOLLOW;
      pos.x += (target.x - pos.x) * ease;
      pos.y += (target.y - pos.y) * ease;
      if (cursorRef.current)
        cursorRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
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
    const onScroll = () => {
      if (reduce) return;
      const y = window.scrollY;
      if (y !== lastY) setScroll(y > lastY ? "down" : "up");
      lastY = y;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setScroll(null);
        // 스크롤로 커서 아래 요소가 바뀌었을 수 있어서 다시 확인
        inspect(document.elementFromPoint(target.x, target.y));
      }, 160);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      root.classList.remove("has-custom-cursor");
      dialogs.disconnect();
      if (cursor?.matches(":popover-open")) cursor.hidePopover();
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, [enabled]);

  if (!enabled) return null;
  // 스크롤 중에는 스크롤 표현만 (커짐 · 설명은 멈춘 뒤에)
  const size = hover && !scroll ? SIZE.hover : SIZE.base;
  const showLabel = Boolean(label) && !scroll;
  const direction = scroll === "down" ? -1 : 1;

  return (
    <div
      ref={cursorRef}
      aria-hidden
      // 최상위 층에 올리기 위한 popover (브라우저 기본 popover 모양은 아래 클래스로 지움)
      popover="manual"
      className={classNames(
        "size-0",
        "pointer-events-none fixed inset-auto top-0 left-0 z-200 overflow-visible",
        "m-0 border-0 bg-transparent p-0",
        "mix-blend-difference transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {/* 스크롤할 때 붙는 작은 원 두 개 */}
      {TRAIL.map((dot) => (
        <span
          key={dot.gap}
          style={{
            width: dot.size,
            height: dot.size,
            transform: `translate(-50%, -50%) translateY(${scroll ? direction * (size / 2 + dot.gap) : 0}px)`,
          }}
          className={classNames(
            "absolute top-0 left-0",
            "rounded-full bg-white",
            "transition-[transform,opacity] duration-300 ease-out",
            scroll ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
      {/* 원 */}
      <span
        style={{
          width: size,
          height: size,
          transform: "translate(-50%, -50%)",
        }}
        className={classNames(
          "absolute top-0 left-0",
          "rounded-full bg-white",
          "transition-[width,height] duration-200 ease-out",
        )}
      />
      {/* 설명 (cursor-label) */}
      <span
        style={{ transform: `translate(-50%, ${size / 2 + 10}px)` }}
        className={classNames(
          "absolute top-0 left-0",
          "transition-[opacity,transform] duration-200",
          "font-neuehaas text-[11px] font-medium whitespace-nowrap text-white",
          showLabel ? "opacity-100" : "opacity-0",
        )}
      >
        {label}
      </span>
    </div>
  );
}
