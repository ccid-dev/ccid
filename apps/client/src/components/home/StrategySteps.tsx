"use client";

import classNames from "classnames";
import { useEffect, useRef } from "react";

/** 단계 이름 (UI 글자라 영어로 둡니다) */
const STEPS = ["Research", "Strategy", "Systems", "Prototypes"] as const;

/** 한 바퀴 시간표 (초) */
const DROP = 0.7; // 위에서 첫 칸(Research)으로 떨어짐
const HOP = 0.55; // 계단 한 칸 튀어 내려감
const REST = 1.4; // 마지막 칸(Prototypes)에서 머묾
const FADE = 0.45; // 사라짐
const PAUSE = 0.5; // 다음 바퀴 전 쉼
const SQUASH = 0.16; // 착지 때 눌림 시간
const LANDINGS = STEPS.map((_, i) => DROP + i * HOP); // 각 단계에 닿는 시각
const CYCLE = LANDINGS[STEPS.length - 1]! + REST + FADE + PAUSE;

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** 페이지의 색 · 글꼴 (global.css 토큰) */
function readTheme(el: HTMLElement) {
  const root = getComputedStyle(document.documentElement);
  const pick = (name: string, fallback: string) =>
    root.getPropertyValue(name).trim() || fallback;
  return {
    ball: pick("--color-black", "#141414"),
    step: pick("--color-white", "#fbfbfb"),
    main: pick("--text-color-main", "#141414"),
    mute: pick("--text-color-mute", "#99a1af"),
    font: getComputedStyle(el).fontFamily,
  };
}

/** 지금 크기에서의 계단 · 공 위치 */
function layout(width: number, height: number) {
  const gap = clamp(width * 0.015, 4, 8);
  const colW = (width - gap * 3) / 4;
  const top0 = height * 0.24;
  const rise = (height * 0.74 - top0) / 3;
  const steps = STEPS.map((_, i) => ({
    x: i * (colW + gap),
    y: top0 + i * rise,
    w: colW,
    cx: i * (colW + gap) + colW / 2,
  }));
  return {
    steps,
    radius: clamp(colW * 0.075, 5, 9),
    hop: clamp(rise * 0.9, 18, 60),
    corner: clamp(colW * 0.12, 8, 14),
    font: clamp(colW * 0.13, 11, 15),
  };
}

/**
 * 디자인 전략 단계 (2D canvas).
 * 오른쪽 아래로 내려가는 계단 4칸 위로 검은 공이 떨어져 Research → Prototypes 를 차례로 튀며 내려가고,
 * 닿은 단계 글자가 차례로 진해집니다. 마지막 칸에서 잠깐 머문 뒤 사라지고 다시 시작합니다.
 * - 칸 크기는 실제 너비 · 높이에 맞춰 다시 계산합니다. (반응형)
 * - 화면에 보일 때만 움직이고, 움직임 줄이기 설정이면 멈춘 그림(모두 진하게)만 그립니다.
 */
export function StrategySteps() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let theme = readTheme(canvas);
    let size = { width: 0, height: 0 };
    let frame = 0;
    let visible = false;
    let start = performance.now();

    const draw = (time: number) => {
      const { width, height } = size;
      if (!width || !height) return;
      const g = layout(width, height);
      const t = reduce.matches ? Infinity : ((time - start) / 1000) % CYCLE;
      const fadeStart = LANDINGS[STEPS.length - 1]! + REST;

      ctx.clearRect(0, 0, width, height);

      // 계단 칸 + 글자 (닿은 단계부터 진하게, 사라질 때 함께 흐려짐)
      g.steps.forEach((step, i) => {
        ctx.fillStyle = theme.step;
        ctx.beginPath();
        ctx.roundRect(step.x, step.y, step.w, height - step.y, [
          g.corner,
          g.corner,
          g.corner,
          g.corner,
        ]);
        ctx.fill();

        const on = t >= LANDINGS[i]! && t < fadeStart + FADE * 0.5;
        const pad = g.font * 0.85;
        ctx.fillStyle = on || reduce.matches ? theme.main : theme.mute;
        ctx.textBaseline = "top";
        ctx.font = `500 ${Math.round(g.font)}px ${theme.font}`;
        ctx.fillText(STEPS[i]!, step.x + pad, step.y + pad, step.w - pad * 1.5);
      });

      if (reduce.matches) return;

      // 공 위치: 떨어짐(중력) → 포물선으로 한 칸씩 → 머묾 → 사라짐
      const first = g.steps[0]!;
      const last = g.steps[STEPS.length - 1]!;
      let x = first.cx;
      let y: number;
      let alpha = 1;
      if (t < DROP) {
        const s = t / DROP;
        y = -g.radius * 2 + (first.y + g.radius * 2) * s * s;
        alpha = clamp(s * 3, 0, 1);
      } else if (t < LANDINGS[STEPS.length - 1]!) {
        const i = Math.floor((t - DROP) / HOP);
        const s = (t - DROP - i * HOP) / HOP;
        const from = g.steps[i]!;
        const to = g.steps[i + 1]!;
        x = from.cx + (to.cx - from.cx) * s;
        y = from.y + (to.y - from.y) * s - g.hop * 4 * s * (1 - s);
      } else {
        x = last.cx;
        y = last.y;
        alpha = clamp(1 - (t - fadeStart) / FADE, 0, 1);
      }

      // 착지 직후 살짝 눌림
      const since = Math.min(
        ...LANDINGS.map((l) => (t >= l ? t - l : Infinity)),
      );
      const squash = since < SQUASH ? Math.sin((since / SQUASH) * Math.PI) : 0;
      const rx = g.radius * (1 + 0.3 * squash);
      const ry = g.radius * (1 - 0.3 * squash);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = theme.ball;
      ctx.beginPath();
      ctx.ellipse(x, y - ry, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const loop = (time: number) => {
      draw(time);
      if (visible && !reduce.matches) frame = requestAnimationFrame(loop);
    };
    const play = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(loop);
    };

    const resize = () => {
      const { width, height } = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      size = { width, height };
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);
    const visibility = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (visible) {
        start = performance.now();
        play();
      } else cancelAnimationFrame(frame);
    });
    visibility.observe(wrap);
    const onReduce = () => (reduce.matches ? draw(performance.now()) : play());
    reduce.addEventListener("change", onReduce);
    // 글꼴을 다 받은 뒤 다시 그림 (처음엔 대체 글꼴일 수 있음)
    document.fonts?.ready.then(() => {
      theme = readTheme(canvas);
      draw(performance.now());
    });

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibility.disconnect();
      reduce.removeEventListener("change", onReduce);
    };
  }, []);

  return (
    <div ref={wrapRef} className={classNames("size-full", "relative")}>
      <canvas
        ref={canvasRef}
        aria-hidden
        className={classNames("size-full", "absolute inset-0", "font-neuehaas")}
      />
      {/* 화면 읽기용 단계 목록 */}
      <ol className={classNames("sr-only")}>
        {STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
