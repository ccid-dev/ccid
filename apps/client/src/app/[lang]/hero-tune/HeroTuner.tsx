"use client";

import classNames from "classnames";
import { button, folder, Leva, useControls } from "leva";
import { useEffect, useRef, useState } from "react";
import {
  HERO_BACKGROUND_DEFAULTS,
  HeroBackground,
  type HeroBackgroundConfig,
  HomeHero,
} from "@/components/home";

/** 값 파일 (내보낸 JSON 을 그대로 붙여 넣을 곳) */
const VALUES_FILE = "apps/client/src/components/home/hero-background.json";

const D = HERO_BACKGROUND_DEFAULTS;

/** 패널 값(평평한 이름) → 값 파일 모양 */
const toConfig = (v: Record<string, unknown>): HeroBackgroundConfig => ({
  intensity: v.intensity as number,
  motion: {
    speed: v.speed as number,
    drift: v.drift as number,
    wave: v.wave as number,
    colorShift: v.colorShift as number,
    cursorStrength: v.cursorStrength as number,
    cursorSpeed: v.cursorSpeed as number,
    scrollStrength: v.scrollStrength as number,
  },
  band: D.band.map((_, i) => ({
    position: v[`band${i}Position`] as number,
    color: (v[`band${i}Color`] as string).toUpperCase(),
    opacity: v[`band${i}Opacity`] as number,
  })),
  circle: {
    opacity: v.circleOpacity as number,
    stops: D.circle.stops.map((_, i) => ({
      position: v[`circle${i}Position`] as number,
      color: (v[`circle${i}Color`] as string).toUpperCase(),
    })),
  },
  fade: {
    top: v.fadeTop as number,
    bottom: v.fadeBottom as number,
  },
});

/** 값 파일 모양 → 패널 값(평평한 이름) — '기존값으로' 에 씀 */
const toFlat = (c: HeroBackgroundConfig) => ({
  intensity: c.intensity,
  ...c.motion,
  ...Object.fromEntries(
    c.band.flatMap((stop, i) => [
      [`band${i}Position`, stop.position],
      [`band${i}Color`, stop.color],
      [`band${i}Opacity`, stop.opacity],
    ]),
  ),
  circleOpacity: c.circle.opacity,
  ...Object.fromEntries(
    c.circle.stops.flatMap((stop, i) => [
      [`circle${i}Position`, stop.position],
      [`circle${i}Color`, stop.color],
    ]),
  ),
  fadeTop: c.fade.top,
  fadeBottom: c.fade.bottom,
});

const toJson = (config: HeroBackgroundConfig) =>
  `${JSON.stringify(config, null, 2)}\n`;

/**
 * 첫 화면 배경 튜닝 화면 (/hero-tune).
 * 실제 첫 화면을 띄워 두고, 오른쪽 위 패널(Leva)에서 값을 바꾸면 바로 반영됩니다.
 * 패널의 'JSON 복사' · 'JSON 다운로드' 로 내보내 hero-background.json 에 통째로 붙여 넣으세요.
 */
export function HeroTuner({ description }: { description: string }) {
  const [toast, setToast] = useState("");
  const configRef = useRef<HeroBackgroundConfig>(D);
  // '기존값으로' 버튼에서 패널 값을 바꿀 함수 (패널을 만든 뒤에 채움)
  const setRef = useRef<(next: ReturnType<typeof toFlat>) => void>(() => {});

  const [values, set] = useControls(() => ({
    intensity: {
      value: D.intensity,
      min: 0,
      max: 10,
      step: 0.1,
      label: "투명도 배율",
    },
    모션: folder({
      speed: {
        value: D.motion.speed,
        min: 0,
        max: 15,
        step: 0.1,
        label: "빠르기",
      },
      drift: {
        value: D.motion.drift,
        min: 0,
        max: 6,
        step: 0.1,
        label: "떠다니는 폭",
      },
      wave: {
        value: D.motion.wave,
        min: 0,
        max: 6,
        step: 0.1,
        label: "띠 경계 물결",
      },
      colorShift: {
        value: D.motion.colorShift,
        min: 0,
        max: 6,
        step: 0.1,
        label: "색 위치 오감",
      },
      cursorStrength: {
        value: D.motion.cursorStrength,
        min: 0,
        max: 6,
        step: 0.1,
        label: "마우스 끌림",
      },
      cursorSpeed: {
        value: D.motion.cursorSpeed,
        min: 0.1,
        max: 6,
        step: 0.1,
        label: "마우스 따라옴",
      },
      scrollStrength: {
        value: D.motion.scrollStrength,
        min: 0,
        max: 3,
        step: 0.1,
        label: "스크롤 퍼짐",
      },
    }),
    "띠 색 (band)": folder(
      Object.fromEntries(
        D.band.flatMap((stop, i) => [
          [
            `band${i}Position`,
            {
              value: stop.position,
              min: 0,
              max: 1,
              step: 0.001,
              label: `${i + 1} 위치`,
            },
          ],
          [`band${i}Color`, { value: stop.color, label: `${i + 1} 색` }],
          [
            `band${i}Opacity`,
            {
              value: stop.opacity,
              min: 0,
              max: 1,
              step: 0.01,
              label: `${i + 1} 투명도`,
            },
          ],
        ]),
      ),
    ),
    "원 색 (circle)": folder({
      circleOpacity: {
        value: D.circle.opacity,
        min: 0,
        max: 1,
        step: 0.005,
        label: "투명도",
      },
      ...Object.fromEntries(
        D.circle.stops.flatMap((stop, i) => [
          [
            `circle${i}Position`,
            {
              value: stop.position,
              min: 0,
              max: 1.5,
              step: 0.001,
              label: `${i + 1} 위치`,
            },
          ],
          [`circle${i}Color`, { value: stop.color, label: `${i + 1} 색` }],
        ]),
      ),
    }),
    "위아래 페이드": folder({
      fadeTop: { value: D.fade.top, min: 0, max: 50, step: 1, label: "위 (%)" },
      fadeBottom: {
        value: D.fade.bottom,
        min: 50,
        max: 100,
        step: 1,
        label: "아래 (%)",
      },
    }),
    "파일로 내보내기": folder({
      "JSON 복사": button(() => {
        void navigator.clipboard
          .writeText(toJson(configRef.current))
          .then(() =>
            setToast("복사했어요 · hero-background.json 에 붙여 넣으세요"),
          )
          .catch(() => setToast("복사하지 못했어요 · 다운로드를 써 주세요"));
      }),
      "JSON 다운로드": button(() => {
        const url = URL.createObjectURL(
          new Blob([toJson(configRef.current)], { type: "application/json" }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = "hero-background.json";
        a.click();
        URL.revokeObjectURL(url);
        setToast("다운로드했어요 · 같은 이름 파일을 바꿔 넣으세요");
      }),
      기존값으로: button(() => {
        setRef.current(toFlat(D));
        setToast("파일 값으로 되돌렸어요");
      }),
    }),
  }));

  const config = toConfig(values as Record<string, unknown>);
  useEffect(() => {
    configRef.current = config;
    setRef.current = set as (next: ReturnType<typeof toFlat>) => void;
  });

  // 안내 문구는 잠깐만
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <>
      <Leva
        titleBar={{ title: "Hero Tune", filter: false }}
        theme={{ sizes: { rootWidth: "340px", controlWidth: "180px" } }}
      />

      <HomeHero
        description={description}
        background={<HeroBackground config={config} />}
      />

      {/* 스크롤 퇴장 모션 · 아래 경계 확인용 */}
      <div
        className={classNames(
          "min-h-svh px-5 py-24 md:px-10",
          "flex flex-col gap-2",
        )}
      >
        <p className={classNames("font-neuehaas text-2xl")}>Hero Tune</p>
        <p className={classNames("text-sm text-sub")}>
          스크롤해서 퇴장 모션과 아래 경계를 확인하세요. 값 파일: {VALUES_FILE}
        </p>
      </div>

      {toast ? (
        <p
          role="status"
          className={classNames(
            "fixed bottom-6 left-1/2 z-[1001] -translate-x-1/2",
            "rounded-full bg-black px-4 py-2",
            "text-sm text-white",
          )}
        >
          {toast}
        </p>
      ) : null}
    </>
  );
}
