"use client";

import classNames from "classnames";
import { button, folder, Leva, useControls } from "leva";
import { useEffect, useRef, useState } from "react";
import {
  FOOTER_BACKGROUND_DEFAULTS,
  type FooterBackgroundConfig,
  footerBackgroundLive,
} from "@/components/footer-background/FooterBackground";

/** 값 파일 (내보낸 JSON 을 그대로 붙여 넣을 곳) */
const VALUES_FILE =
  "apps/client/src/components/footer-background/footer-background.json";

const D = FOOTER_BACKGROUND_DEFAULTS;

/** 패널 값(평평한 이름) → 값 파일 모양 */
const toConfig = (v: Record<string, unknown>): FooterBackgroundConfig => ({
  fade: v.fade as number,
  base: D.base.map((_, i) => ({
    position: v[`base${i}Position`] as number,
    color: (v[`base${i}Color`] as string).toUpperCase(),
    opacity: v[`base${i}Opacity`] as number,
  })),
  shader: {
    opacity: v.shaderOpacity as number,
    blur: v.shaderBlur as number,
    intensity: v.intensity as number,
    detail: v.detail as number,
    twist: v.twist as number,
    warp: v.warp as number,
    zoom: v.zoom as number,
    rotationSpeed: v.rotationSpeed as number,
    morphSpeed: v.morphSpeed as number,
    gradientBalance: v.gradientBalance as number,
    gradientMethod: v.gradientMethod as number,
    material: v.material as number,
    colors: D.shader.colors.map((_, i) => ({
      position: v[`color${i}Position`] as number,
      color: (v[`color${i}Color`] as string).toUpperCase(),
    })),
  },
  glow: v.glow as number,
});

/** 값 파일 모양 → 패널 값(평평한 이름) — '기존값으로' 에 씀 */
const toFlat = (c: FooterBackgroundConfig) => {
  const { opacity, blur, colors, ...shader } = c.shader;
  return {
    fade: c.fade,
    glow: c.glow,
    shaderOpacity: opacity,
    shaderBlur: blur,
    ...shader,
    ...Object.fromEntries(
      c.base.flatMap((stop, i) => [
        [`base${i}Position`, stop.position],
        [`base${i}Color`, stop.color],
        [`base${i}Opacity`, stop.opacity],
      ]),
    ),
    ...Object.fromEntries(
      colors.flatMap((stop, i) => [
        [`color${i}Position`, stop.position],
        [`color${i}Color`, stop.color],
      ]),
    ),
  };
};

const toJson = (config: FooterBackgroundConfig) =>
  `${JSON.stringify(config, null, 2)}\n`;

const scrollToFooter = () =>
  document
    .getElementById("contact")
    ?.scrollIntoView({ behavior: "smooth", block: "end" });

/**
 * 푸터 배경 튜닝 화면 (/footer-tune).
 * 아래 실제 푸터를 보면서 오른쪽 위 패널(Leva)에서 값을 바꾸면 바로 반영됩니다.
 * 패널의 'JSON 복사' · 'JSON 다운로드' 로 내보내 footer-background.json 에 통째로 붙여 넣으세요.
 */
export function FooterTuner() {
  const [toast, setToast] = useState("");
  const configRef = useRef<FooterBackgroundConfig>(D);
  // '기존값으로' 버튼에서 패널 값을 바꿀 함수 (패널을 만든 뒤에 채움)
  const setRef = useRef<(next: ReturnType<typeof toFlat>) => void>(() => {});

  const [values, set] = useControls(() => ({
    fade: {
      value: D.fade,
      min: 0,
      max: 100,
      step: 1,
      label: "위 페이드 (%)",
    },
    모션: folder({
      morphSpeed: {
        value: D.shader.morphSpeed,
        min: 0,
        max: 10,
        step: 0.1,
        label: "일렁임 빠르기",
      },
      rotationSpeed: {
        value: D.shader.rotationSpeed,
        min: 0,
        max: 100,
        step: 1,
        label: "도는 빠르기 (%)",
      },
    }),
    모양: folder({
      intensity: {
        value: D.shader.intensity,
        min: 0,
        max: 5,
        step: 0.01,
        label: "굴곡 세기",
      },
      detail: {
        value: D.shader.detail,
        min: 0,
        max: 5,
        step: 0.01,
        label: "디테일",
      },
      twist: {
        value: D.shader.twist,
        min: 0,
        max: 7,
        step: 0.01,
        label: "비틀림",
      },
      warp: {
        value: D.shader.warp,
        min: 0,
        max: 1.5,
        step: 0.01,
        label: "흐름 (flow)",
      },
      zoom: {
        value: D.shader.zoom,
        min: 0,
        max: 100,
        step: 1,
        label: "확대 (%)",
      },
      gradientMethod: {
        value: D.shader.gradientMethod,
        options: { Height: 0, Noise: 1, Facing: 2 },
        label: "색 나누는 법",
      },
      material: {
        value: D.shader.material,
        options: { None: 0, Satin: 1, Glossy: 2, Metallic: 3, Iridescent: 4 },
        label: "재질",
      },
    }),
    "셰이더 색": folder({
      shaderOpacity: {
        value: D.shader.opacity,
        min: 0,
        max: 1,
        step: 0.01,
        label: "투명도",
      },
      shaderBlur: {
        value: D.shader.blur,
        min: 0,
        max: 120,
        step: 1,
        label: "흐림 (px)",
      },
      gradientBalance: {
        value: D.shader.gradientBalance,
        min: -100,
        max: 100,
        step: 1,
        label: "색 균형 (%)",
      },
      ...Object.fromEntries(
        D.shader.colors.flatMap((stop, i) => [
          [
            `color${i}Position`,
            {
              value: stop.position,
              min: 0,
              max: 1,
              step: 0.01,
              label: `${i + 1} 위치`,
            },
          ],
          [`color${i}Color`, { value: stop.color, label: `${i + 1} 색` }],
        ]),
      ),
    }),
    "바탕 그라디언트": folder(
      Object.fromEntries(
        D.base.flatMap((stop, i) => [
          [
            `base${i}Position`,
            {
              value: stop.position,
              min: 0,
              max: 1,
              step: 0.001,
              label: `${i + 1} 위치`,
            },
          ],
          [`base${i}Color`, { value: stop.color, label: `${i + 1} 색` }],
          [
            `base${i}Opacity`,
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
    "빛 번짐": folder({
      glow: {
        value: D.glow,
        min: 0,
        max: 1,
        step: 0.01,
        label: "투명도",
      },
    }),
    "파일로 내보내기": folder({
      "JSON 복사": button(() => {
        void navigator.clipboard
          .writeText(toJson(configRef.current))
          .then(() =>
            setToast("복사했어요 · footer-background.json 에 붙여 넣으세요"),
          )
          .catch(() => setToast("복사하지 못했어요 · 다운로드를 써 주세요"));
      }),
      "JSON 다운로드": button(() => {
        const url = URL.createObjectURL(
          new Blob([toJson(configRef.current)], { type: "application/json" }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = "footer-background.json";
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
  const configJson = JSON.stringify(config);
  useEffect(() => {
    configRef.current = config;
    setRef.current = set as (next: ReturnType<typeof toFlat>) => void;
  });

  // 레이아웃의 실제 푸터에 바로 반영 (이 페이지를 떠나면 파일 값으로)
  useEffect(() => {
    footerBackgroundLive.set(JSON.parse(configJson) as FooterBackgroundConfig);
  }, [configJson]);
  useEffect(() => () => footerBackgroundLive.set(null), []);

  // 처음 들어오면 푸터가 보이게
  useEffect(() => {
    const timer = window.setTimeout(scrollToFooter, 300);
    return () => window.clearTimeout(timer);
  }, []);

  // 안내 문구는 잠깐만
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <>
      <Leva
        titleBar={{ title: "Footer Tune", filter: false }}
        theme={{ sizes: { rootWidth: "340px", controlWidth: "180px" } }}
      />

      {/* 위쪽 흰 본문과 이어지는지 보려고 흰 공간을 둠 */}
      <div
        className={classNames(
          "min-h-[70svh] px-5 pt-32 pb-24 md:px-10",
          "flex flex-col gap-2",
        )}
      >
        <p className={classNames("font-neuehaas text-2xl")}>Footer Tune</p>
        <p className={classNames("text-sm text-sub")}>
          아래 푸터를 보며 조절하세요. 위쪽이 흰 본문과 끊기지 않는지도
          확인하세요. 값 파일: {VALUES_FILE}
        </p>
        <button
          type="button"
          onClick={scrollToFooter}
          className={classNames(
            "mt-4 self-start",
            "font-neuehaas text-sm font-medium underline-offset-4 hover:underline",
          )}
        >
          푸터로 내리기 ↓
        </button>
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
