"use client";

import classNames from "classnames";
import { button, folder, Leva, useControls } from "leva";
import { useEffect, useRef, useState } from "react";
import {
  HomeProjectsBackground,
  PROJECTS_BACKGROUND_DEFAULTS,
  type ProjectsBackgroundConfig,
} from "@/components/home";

/** 값 파일 (내보낸 JSON 을 그대로 붙여 넣을 곳) */
const VALUES_FILE = "apps/client/src/components/home/projects-background.json";

const D = PROJECTS_BACKGROUND_DEFAULTS;

type Layer = ProjectsBackgroundConfig["layers"][number];
type Flat = Record<string, number | string>;

/** 층 하나의 패널 항목 (이름 · 범위 · 설명) */
const FIELDS: {
  key: Exclude<keyof Layer, "name" | "color">;
  label: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "alpha", label: "진하기", min: 0, max: 1, step: 0.01 },
  { key: "left", label: "왼쪽 위치 (%)", min: -50, max: 100, step: 1 },
  { key: "top", label: "위 위치 (%)", min: -50, max: 100, step: 1 },
  { key: "width", label: "너비 (%)", min: 10, max: 200, step: 1 },
  { key: "height", label: "높이 (%)", min: 5, max: 200, step: 1 },
  {
    key: "x",
    label: "좌우로 흐르는 폭 (%, 음수 = 반대로)",
    min: -60,
    max: 60,
    step: 1,
  },
  { key: "y", label: "위아래로 흐르는 폭 (%)", min: -60, max: 60, step: 1 },
  { key: "tilt", label: "기울기 (도)", min: -45, max: 45, step: 0.5 },
  { key: "rotate", label: "기울기 오감 (도)", min: 0, max: 30, step: 0.5 },
  { key: "scale", label: "커지는 배율", min: 0.8, max: 1.6, step: 0.01 },
  { key: "opacityMin", label: "가장 옅을 때", min: 0, max: 1, step: 0.01 },
  { key: "opacityMax", label: "가장 진할 때", min: 0, max: 1, step: 0.01 },
  { key: "seconds", label: "한 바퀴 (초)", min: 4, max: 60, step: 0.5 },
  { key: "delay", label: "시작 늦춤 (초)", min: 0, max: 20, step: 0.5 },
];

/** 값 파일 → 패널 값 (층 번호를 이름에 붙여 평평하게) */
const toFlat = (c: ProjectsBackgroundConfig): Flat => {
  const flat: Flat = { intensity: c.intensity, speed: c.speed };
  c.layers.forEach((layer, i) => {
    flat[`l${i}_color`] = layer.color;
    for (const f of FIELDS) flat[`l${i}_${f.key}`] = layer[f.key];
  });
  return flat;
};

/** 패널 값 → 값 파일 모양 */
const toConfig = (v: Record<string, unknown>): ProjectsBackgroundConfig => ({
  intensity: Number(v.intensity),
  speed: Number(v.speed),
  layers: D.layers.map((base, i) => {
    const layer: Record<string, unknown> = { name: base.name };
    layer.color = String(v[`l${i}_color`] ?? base.color);
    for (const f of FIELDS) layer[f.key] = Number(v[`l${i}_${f.key}`]);
    return layer as Layer;
  }),
});

const toJson = (c: ProjectsBackgroundConfig) =>
  `${JSON.stringify(c, null, 2)}\n`;

/**
 * 홈 Projects 구역 배경 튜닝 페이지.
 * 배경 위에 실제 Projects 목록 모양의 자리표시 글을 올려 두고, 오른쪽 위 패널(Leva)에서 값을 바꾸면 바로 반영됩니다.
 * 패널의 'JSON 복사' · 'JSON 다운로드' 로 내보내 projects-background.json 에 통째로 붙여 넣으세요.
 */
export function ProjectsTuner() {
  const [toast, setToast] = useState("");
  const configRef = useRef<ProjectsBackgroundConfig>(D);
  const setRef = useRef<(next: Flat) => void>(() => {});

  const flat = toFlat(D);
  const [values, set] = useControls(() => ({
    intensity: {
      value: D.intensity,
      min: 0,
      max: 2,
      step: 0.05,
      label: "전체 진하기 배율",
    },
    speed: {
      value: D.speed,
      min: 0.2,
      max: 4,
      step: 0.05,
      label: "전체 빠르기 배율",
    },
    ...Object.fromEntries(
      D.layers.map((layer, i) => [
        layer.name,
        folder(
          {
            [`l${i}_color`]: {
              value: String(flat[`l${i}_color`]),
              label: "색",
            },
            ...Object.fromEntries(
              FIELDS.map((f) => [
                `l${i}_${f.key}`,
                {
                  value: Number(flat[`l${i}_${f.key}`]),
                  min: f.min,
                  max: f.max,
                  step: f.step,
                  label: f.label,
                },
              ]),
            ),
          },
          { collapsed: i > 1 },
        ),
      ]),
    ),
    "파일로 내보내기": folder({
      "JSON 복사": button(() => {
        void navigator.clipboard
          .writeText(toJson(configRef.current))
          .then(() =>
            setToast("복사했어요 · projects-background.json 에 붙여 넣으세요"),
          )
          .catch(() => setToast("복사하지 못했어요 · 다운로드를 써 주세요"));
      }),
      "JSON 다운로드": button(() => {
        const url = URL.createObjectURL(
          new Blob([toJson(configRef.current)], { type: "application/json" }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = "projects-background.json";
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
    setRef.current = set as (next: Flat) => void;
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
        titleBar={{ title: "Projects Tune", filter: false }}
        theme={{ sizes: { rootWidth: "340px", controlWidth: "180px" } }}
      />

      {/* 실제 홈의 Projects 구역과 같은 틀: 배경은 화면 한 장 높이(svh)에 붙어 있음 */}
      <div className={classNames("relative isolate")}>
        <HomeProjectsBackground config={config} />
        <section className={classNames("min-h-svh px-5 py-24 md:px-10")}>
          <p className={classNames("font-neuehaas text-2xl")}>Projects Tune</p>
          <p className={classNames("mt-2 text-sm text-sub")}>
            패널에서 층마다 색 · 자리 · 모션을 조절하세요. 값 파일:{" "}
            {VALUES_FILE}
          </p>
          <ul
            className={classNames(
              "mt-16 flex max-w-2xl flex-col gap-6 lg:ml-[20%]",
            )}
          >
            {[
              "AI 기반 2D–3D 통합 설계전환 체계 및 내재화 핵심기술 개발",
              "생성형 사용자 인터페이스 연구",
              "SDV를 위한 사용자 의도 기반 적응형 GenUI",
              "GenUI 디자인 프로세스 및 사용자 경험 가치 검증",
              "AI TV Flexible UI 원칙 및 Adaptive Interaction 연구",
            ].map((title) => (
              <li key={title} className={classNames("text-xl leading-snug")}>
                {title}
              </li>
            ))}
          </ul>
        </section>
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
