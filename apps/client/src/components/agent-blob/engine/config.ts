// AgentBlob 설정: 값의 모양(타입) + presets/*.json 을 합친 기본값.
// 값 자체는 ../presets/*.json 에 상황별로 나뉘어 있습니다. /agent-tune 페이지에서 조절한 뒤
// 내보낸 JSON 을 같은 이름의 파일에 그대로 붙여 넣으면 됩니다.

import base from "../presets/base.json";
import hover from "../presets/hover.json";
import idle from "../presets/idle.json";
import listening from "../presets/listening.json";
import press from "../presets/press.json";
import speaking from "../presets/speaking.json";
import thinking from "../presets/thinking.json";

/** 에이전트 상태 */
export const BLOB_STATES = [
  "idle",
  "listening",
  "thinking",
  "speaking",
] as const;
export type BlobState = (typeof BLOB_STATES)[number];

/** 상황: 에이전트 상태 4개 + 손으로 건드릴 때 2개(hover · press). 각각 presets/<상황>.json */
export const BLOB_SITUATIONS = [
  "idle",
  "hover",
  "press",
  "listening",
  "thinking",
  "speaking",
] as const;
export type BlobSituation = (typeof BLOB_SITUATIONS)[number];

/** 한 상황의 모션 · 셰이더 값. 상황이 바뀌면 지금 값에서 이 값으로 부드럽게 옮겨 갑니다. */
export interface BlobPreset {
  /** 흐름 빠르기 (시간 배속) */
  speed: number;
  /** 0–1. 파랑-보라 덩어리의 진하기 */
  energy: number;
  /** 0–1. 소용돌이처럼 비틀림 (thinking 에 어울림) */
  swirl: number;
  /** 파랑 · 라벤더 영역이 도는 빠르기 (색 회전) */
  colorOrbit: number;
  /** 크기 배율 (1 = 원래 크기) */
  scale: number;
  /** 숨쉬듯 커졌다 작아지는 폭 */
  breathe: number;
  /** 가장자리 일렁임 (0 = 완전한 원) */
  morph: number;
  /** 노이즈 확대 정도. 낮을수록 색 덩어리가 크고 부드러움 */
  noiseScale: number;
  /** 1차 비틀기 세기 */
  warp1: number;
  /** 2차 비틀기 세기. 높을수록 액체 · 마블 느낌 */
  warp2: number;
  /** 0–1. 렌즈처럼 볼록한 정도 (구의 입체감) */
  bulge: number;
  /** 테두리 빛 세기 */
  rim: number;
  /** 하이라이트(반사광) 세기 */
  specular: number;
  /** 0–1. 바깥 번짐 빛의 진하기 */
  glow: number;
  /** 바깥 번짐 빛의 크기 배율 */
  glowScale: number;
}

/** 상황과 상관없이 공통인 값 (presets/base.json) */
export interface BlobBase {
  /** 팔레트 5색 (밝은 색 → 강조색) */
  colors: string[];
  /** 모달로 펼쳐졌을 때 */
  panel: {
    /** 펼쳐졌을 때 노이즈 확대 정도 */
    noiseScale: number;
    /** 모서리 둥글기 (px) */
    radius: number;
  };
  /** 음성 크기(0–1)에 따른 반응 — listening · speaking 일 때 */
  voice: {
    /** 크기가 커지는 정도 */
    levelScale: number;
    /** 번짐 빛이 커지는 정도 */
    levelGlow: number;
    /** 가장자리 일렁임이 커지는 정도 */
    levelMorph: number;
    /** 색이 밝아지는 정도 */
    levelBrightness: number;
  };
  /** 상황이 바뀔 때 따라가는 빠르기 (클수록 빠릿함) */
  motion: {
    /** 흐름 · 색 · 질감 값 */
    ease: number;
    /** 크기 */
    scaleEase: number;
  };
}

export interface BlobConfig extends BlobBase {
  situations: Record<BlobSituation, BlobPreset>;
}

/** BlobPreset 의 키 (순서 = 튜닝 패널 순서) */
export const BLOB_PRESET_KEYS = [
  "speed",
  "energy",
  "swirl",
  "colorOrbit",
  "scale",
  "breathe",
  "morph",
  "noiseScale",
  "warp1",
  "warp2",
  "bulge",
  "rim",
  "specular",
  "glow",
  "glowScale",
] as const satisfies readonly (keyof BlobPreset)[];

const situations: Record<BlobSituation, BlobPreset> = {
  idle,
  hover,
  press,
  listening,
  thinking,
  speaking,
};

/** presets/*.json 을 합친 기본 설정 */
export const DEFAULT_BLOB_CONFIG: BlobConfig = {
  colors: base.colors,
  panel: base.panel,
  voice: base.voice,
  motion: base.motion,
  situations,
};

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/** 일부 값만 기본값 위에 덮어씁니다 (페이지별로 살짝 바꿀 때). */
export function mergeBlobConfig(
  partial?: DeepPartial<BlobConfig> | null,
  base: BlobConfig = DEFAULT_BLOB_CONFIG,
): BlobConfig {
  if (!partial) return base;
  const out = structuredClone(base) as unknown as Record<string, unknown>;
  const walk = (dst: Record<string, unknown>, src: Record<string, unknown>) => {
    for (const k of Object.keys(src)) {
      const v = src[k];
      if (v === undefined) continue;
      if (
        v &&
        typeof v === "object" &&
        !Array.isArray(v) &&
        dst[k] &&
        typeof dst[k] === "object"
      ) {
        walk(dst[k] as Record<string, unknown>, v as Record<string, unknown>);
      } else {
        dst[k] = Array.isArray(v) ? [...v] : v;
      }
    }
  };
  walk(out, partial as Record<string, unknown>);
  return out as unknown as BlobConfig;
}
