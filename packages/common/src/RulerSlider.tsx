"use client";

import classNames from "classnames";
import {
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * 크기별 치수 (px)
 * minor · major: 작은 · 큰 눈금 높이 / tick: 눈금 두께 / needle · needleW: 핸들(표시선) 높이 · 두께
 * minSpacing: 눈금 사이 최소 간격 — 이보다 촘촘하면 눈금을 건너뛰어 그립니다.
 * padX: 양 끝 여백 (md 는 값 말풍선이 잘리지 않을 만큼)
 */
const sizes = {
  sm: {
    minor: 10,
    major: 16,
    tick: 2,
    needle: 22,
    needleW: 3,
    minSpacing: 5,
    padX: 4,
  },
  md: {
    minor: 20,
    major: 32,
    tick: 2,
    needle: 44,
    needleW: 4,
    minSpacing: 8,
    padX: 32,
  },
} as const;

export type RulerSliderSize = keyof typeof sizes;

export type RulerSliderProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  /** 눈금 하나의 값 (스냅 단위). 기본 1 */
  step?: number;
  /** 큰 눈금 간격 (눈금 몇 개마다). 기본 5 */
  majorEvery?: number;
  /** sm: 한 줄 (값 표시 없음) · md: 핸들 위에 값 말풍선 + 삼각형 */
  size?: RulerSliderSize;
  /** 말풍선 · 스크린리더에 읽히는 값 모양 (예: v => `${v}px`) */
  format?: (value: number) => string;
  /** 스크린리더 이름 */
  label?: string;
  disabled?: boolean;
  className?: string;
};

/** 눈금에 붙는 움직임 */
const SNAP_TRANSITION = "left .28s cubic-bezier(.22,1,.36,1)";
/** 눈금을 건너뛸 때 쓰는 간격 후보 (눈금 몇 개마다 하나 그릴지) */
const THIN_STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
/** 폭을 재기 전(서버 렌더) 가정하는 폭 */
const FALLBACK_WIDTH = 320;

/** step 소수점 자리에 맞춰 반올림 (0.30000000000000004 → 0.3) */
const roundTo = (value: number, step: number) => {
  const digits = (String(step).split(".")[1] ?? "").length;
  return Number(value.toFixed(digits));
};

/**
 * 눈금자 슬라이더. 처음부터 최소~최대 눈금이 모두 보이고, 핸들(표시선)이 그 위를 움직입니다.
 * - 아무 곳이나 누르면 핸들이 그리로 오고, 끄는 동안 손을 그대로 따라오다 놓으면 가장 가까운 눈금에 붙습니다(스냅).
 * - 키보드: ← → (한 칸) · Shift + ← → / PageUp · PageDown (큰 눈금 한 칸) · Home · End
 * - 눈금이 너무 촘촘하면 폭에 맞춰 건너뛰어 그립니다. (값은 그대로 step 단위로 스냅)
 * 색은 글자색을 따릅니다: 눈금 = currentColor 30%, 핸들 = currentColor. (예: className="text-purple")
 *
 *   <RulerSlider value={size} onChange={setSize} min={24} max={320} format={(v) => `${v}px`} />
 */
export function RulerSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  majorEvery = 5,
  size = "md",
  format = String,
  label,
  disabled = false,
  className,
}: RulerSliderProps) {
  const s = sizes[size];
  const count = Math.max(1, Math.round((max - min) / step));

  const clamp = useCallback(
    (v: number) => Math.min(max, Math.max(min, v)),
    [min, max],
  );
  /** 값 → 위치 (0–1) */
  const toFraction = useCallback(
    (v: number) => (clamp(v) - min) / (max - min || 1),
    [clamp, min, max],
  );
  /** 위치 (0–1) → 가장 가까운 눈금 값 */
  const toValue = useCallback(
    (fraction: number) =>
      clamp(roundTo(min + Math.round(fraction * count) * step, step)),
    [clamp, min, count, step],
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  /** 끄는 중 (이때는 바깥 value 로 핸들 위치를 덮어쓰지 않음) */
  const draggingRef = useRef<number | null>(null);
  const lastEmittedRef = useRef(value);
  /** 눈금 자리 폭 (재기 전에는 null → 눈금을 % 로 놓음) */
  const [width, setWidth] = useState<number | null>(null);
  // 첫 그리기 위치 (이후 위치는 아래에서 직접 옮겨서, 끄는 중 React 가 덮어쓰지 않게 고정값)
  const [initialFraction] = useState(() => toFraction(value));
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const place = useCallback((fraction: number, animate: boolean) => {
    const handle = handleRef.current;
    if (!handle) return;
    handle.style.transition = animate ? SNAP_TRANSITION : "none";
    handle.style.left = `${fraction * 100}%`;
  }, []);

  const emit = useCallback(
    (fraction: number) => {
      const v = toValue(fraction);
      if (v !== lastEmittedRef.current) {
        lastEmittedRef.current = v;
        onChangeRef.current(v);
      }
    },
    [toValue],
  );

  /** 포인터 x → 위치 (0–1) */
  const fractionAt = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || !rect.width) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  // 바깥에서 value 가 바뀌면 (숫자 입력 · 키보드 등) 그 눈금으로 부드럽게 이동
  useEffect(() => {
    lastEmittedRef.current = value;
    if (draggingRef.current !== null) return;
    place(toFraction(value), true);
  }, [value, toFraction, place]);

  // 폭에 맞춰 눈금 밀도 조절
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingRef.current = event.pointerId;
    // 누른 곳으로 핸들이 미끄러져 옴
    const fraction = fractionAt(event.clientX);
    place(fraction, true);
    emit(fraction);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current !== event.pointerId) return;
    const fraction = fractionAt(event.clientX);
    place(fraction, false);
    emit(fraction);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current !== event.pointerId) return;
    draggingRef.current = null;
    // 가장 가까운 눈금에 붙기
    const v = toValue(fractionAt(event.clientX));
    place(toFraction(v), true);
    emit(toFraction(v));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const big = step * majorEvery;
    const by: Record<string, number> = {
      ArrowRight: event.shiftKey ? big : step,
      ArrowUp: event.shiftKey ? big : step,
      ArrowLeft: event.shiftKey ? -big : -step,
      ArrowDown: event.shiftKey ? -big : -step,
      PageUp: big,
      PageDown: -big,
    };
    let next: number | undefined;
    if (event.key === "Home") next = min;
    else if (event.key === "End") next = max;
    else if (event.key in by)
      next = clamp(roundTo(value + (by[event.key] ?? 0), step));
    if (next === undefined) return;
    event.preventDefault();
    if (next !== value) onChange(next);
  };

  // 그릴 눈금: 너무 촘촘하면 every 개마다 하나 (양 끝은 항상)
  const every =
    THIN_STEPS.find(
      (k) => ((width ?? FALLBACK_WIDTH) / count) * k >= s.minSpacing,
    ) ??
    Math.ceil((count * s.minSpacing) / Math.max(1, width ?? FALLBACK_WIDTH));
  const ticks: { index: number; major: boolean }[] = [];
  for (let i = 0; i <= count; i += every) {
    ticks.push({
      index: i,
      major: every < majorEvery ? i % majorEvery === 0 : (i / every) % 5 === 0,
    });
  }
  if (ticks[ticks.length - 1]?.index !== count)
    ticks.push({ index: count, major: true });

  return (
    <div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={format(value)}
      aria-disabled={disabled || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className={classNames(
        "relative w-full",
        "cursor-pointer touch-pan-y select-none",
        "rounded-md outline-offset-4 focus-visible:outline-2 focus-visible:outline-current",
        disabled && "pointer-events-none opacity-40",
        className,
      )}
      style={{
        // md: 위에 말풍선(34) + 삼각형(8) + 간격 자리
        paddingTop: size === "md" ? 48 : 0,
        paddingLeft: s.padX,
        paddingRight: s.padX,
      }}
    >
      <div
        ref={trackRef}
        className={classNames("relative")}
        style={{ height: s.needle }}
      >
        {/* 눈금 */}
        {ticks.map(({ index, major }) => (
          <span
            key={index}
            aria-hidden
            className={classNames(
              "absolute top-1/2 -translate-y-1/2",
              "rounded-full bg-current opacity-30",
            )}
            style={{
              // 폭을 잰 뒤에는 정수 px 에 찍어 간격이 고르게 (소수 px 면 눈금이 뭉쳐 보임)
              left:
                width === null
                  ? `calc(${(index / count) * 100}% - ${s.tick / 2}px)`
                  : Math.round((index / count) * width - s.tick / 2),
              width: s.tick,
              height: major ? s.major : s.minor,
            }}
          />
        ))}

        {/* 핸들: 표시선 (+ md 는 위에 ▼ · 값 말풍선) */}
        <div
          ref={handleRef}
          aria-hidden
          className={classNames("absolute inset-y-0 -translate-x-1/2")}
          style={{ left: `${initialFraction * 100}%` }}
        >
          <span
            className={classNames("block h-full rounded-full bg-current")}
            style={{ width: s.needleW }}
          />
          {size === "md" && (
            <span
              className={classNames(
                "absolute bottom-full left-1/2 -translate-x-1/2",
                "flex flex-col items-center gap-1 pb-1.5",
              )}
            >
              <output
                className={classNames(
                  "min-w-14 px-3 py-1",
                  "rounded-full border border-gray-200 bg-white/90 shadow-sm",
                  "text-center text-base font-semibold whitespace-nowrap text-main tabular-nums",
                )}
              >
                {format(value)}
              </output>
              {/* ▼ */}
              <span
                className={classNames(
                  "size-0",
                  "border-x-[5px] border-t-[7px] border-x-transparent border-t-current",
                )}
              />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
