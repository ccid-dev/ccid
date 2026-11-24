"use client";

import classNames from "classnames";
import { DriftLayer } from "./DriftLayer";
import defaults from "./projects-background.json";

/** Projects 배경 값 (projects-background.json 과 같은 모양) — /projects-tune 에서 조절해 복사해 넣습니다. */
export type ProjectsBackgroundConfig = typeof defaults;
export const PROJECTS_BACKGROUND_DEFAULTS: ProjectsBackgroundConfig = defaults;

const toRgb = (hex: string) => {
  const n = Number.parseInt(
    hex.replace("#", "").padEnd(6, "0").slice(0, 6),
    16,
  );
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

/**
 * Projects 구역 배경 안개 (Figma "Vector 22"를 코드로 비슷하게): 연보라 안개가 가운데에 깔리고,
 * 장밋빛 · 연보라 덩어리와 흰 · 연보라 빛 번짐이 천천히 흐름. (선처럼 보이는 얇은 띠는 쓰지 않음)
 * 층마다 부드러운 방사형 그라디언트 하나 = 색 · 투명도 · 자리(구역 안 %) · 흐르는 모션.
 * 값은 projects-background.json 에 있고 /projects-tune 페이지에서 조절합니다.
 * 모두 DriftLayer(transform · opacity 만 → GPU 합성)라 자바스크립트가 매 프레임 일하지 않고, blur 필터도 쓰지 않음.
 * 구역이 화면에 멈춰 있는 동안(hold)에도 보이도록 화면 한 장 높이(svh)짜리 틀 안에 둠.
 * 움직임 줄이기 설정이면 멈춘 채 보임.
 */
export function HomeProjectsBackground({
  config = defaults,
}: {
  /** 배경 값 (없으면 projects-background.json) */
  config?: ProjectsBackgroundConfig;
}) {
  return (
    <div
      aria-hidden
      className={classNames(
        "pointer-events-none absolute inset-0 -z-10 overflow-clip",
      )}
    >
      <div className={classNames("sticky top-0 h-svh")}>
        {config.layers.map((layer) => {
          const rgb = toRgb(layer.color);
          const alpha = Math.min(1, layer.alpha * config.intensity);
          return (
            <DriftLayer
              key={layer.name}
              seconds={layer.seconds / Math.max(0.1, config.speed)}
              delay={layer.delay}
              frames={{
                x: [-layer.x, layer.x, -layer.x],
                y: [-layer.y, layer.y, -layer.y],
                rotate: [
                  layer.tilt - layer.rotate,
                  layer.tilt + layer.rotate,
                  layer.tilt - layer.rotate,
                ],
                scale: [1, layer.scale, 1],
                opacity: [layer.opacityMin, layer.opacityMax, layer.opacityMin],
              }}
              // 층마다 다른 값(자리 · 크기 · 색)이라 inline style
              style={{
                left: `${layer.left}%`,
                top: `${layer.top}%`,
                width: `${layer.width}%`,
                height: `${layer.height}%`,
                background: `radial-gradient(closest-side, rgb(${rgb} / ${alpha}), rgb(${rgb} / ${alpha * 0.4}) 55%, rgb(${rgb} / 0))`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
