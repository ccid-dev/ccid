// AgentBlob 설정: 값의 모양(타입) + presets/*.json 을 합친 기본값.
// 값 자체는 ../presets/*.json 에 상황별로 나뉘어 있습니다. /agent-tune 페이지에서 조절한 뒤
// 내보낸 JSON 을 같은 이름의 파일에 그대로 붙여 넣으면 됩니다.
// 그림은 보내주신 flow cursor 셰이더(engine/flow-orb.ts)이고, 값 이름도 원본을 따릅니다.

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

/** 한 상황의 값. 상황이 바뀌면 지금 값에서 이 값으로 부드럽게 옮겨 갑니다. */
export interface BlobPreset {
  /** 흐름 시간 배속 (원본 spin) */
  spin: number;
  /** 0–1. 물결 · 색 움직임의 세기 (원본 셰이더 boost, cursor 에서는 1) */
  boost: number;
  /** 0–1. 채도 · 대비 (원본 셰이더 intensityBoost, cursor 에서는 0) */
  intensity: number;
  /** 테두리 · 안쪽 빛 (원본 glow) */
  glow: number;
  /** 구 둘레 빛번짐 (원본 haze) */
  haze: number;
  /** 밝기 (원본 brightness) */
  brightness: number;
  /** 0–1. 색 경계가 녹아드는 정도 (원본 softness) */
  softness: number;
  /** 0–1. 색 경계의 불규칙함 (원본 colorRandom) */
  colorRandom: number;
  /** 물결 크기 (원본 flowScale) */
  flowScale: number;
  /** 크기 배율 (1 = 원래 크기) */
  scale: number;
  /** 숨쉬듯 커졌다 작아지는 폭 */
  breathe: number;
}

/** 상황과 상관없이 공통인 값 (presets/base.json) */
export interface BlobBase {
  /** 색 · 색 영역 · 불투명도 (원본 flow-cursor.json 과 같은 이름) */
  flow: {
    /** 위 */
    colorA: string;
    /** 아래 */
    colorB: string;
    /** 옆 */
    colorC: string;
    /** 가운데 */
    colorWarm: string;
    /** 테두리 */
    rim: string;
    areaA: number;
    areaB: number;
    areaC: number;
    areaWarm: number;
    areaRim: number;
    opacity: number;
    /** 물결 속도 (원본 flowSpeed) */
    flowSpeed: number;
    /** plasma · glass · liquid */
    style: string;
  };
  /** 모달(대화 창)로 펼쳐졌을 때 */
  panel: {
    /** 모서리 둥글기 (px) */
    radius: number;
    /** 구가 창을 채우는 크기 (창 대각선 대비, 1 = 대각선과 같은 지름) */
    fill: number;
    /** 0–1. 글자가 잘 보이도록 위에 덮는 흰색 */
    veil: number;
  };
  /** 음성 크기(0–1)에 따른 반응 — listening · speaking 일 때 */
  voice: {
    /** 크기가 커지는 정도 */
    levelScale: number;
    /** 빛번짐이 커지는 정도 */
    levelHaze: number;
    /** 밝아지는 정도 */
    levelBrightness: number;
    /** 채도 · 대비가 올라가는 정도 */
    levelIntensity: number;
  };
  /**
   * 구 ↔ 대화 창 모핑 (열고 닫을 때). 위치 · 크기는 스프링(용수철 + 감쇠)으로 움직입니다.
   * 위치가 크기보다 단단하면(빨리 따라가면) 물방울이 먼저 끌려 나온 뒤 퍼집니다.
   */
  morph: {
    /** 위치 스프링 단단함 (클수록 빨리 날아감) */
    stiffness: number;
    /** 위치 스프링 감쇠 (작을수록 도착해서 더 출렁임) */
    damping: number;
    /** 크기 스프링 단단함 */
    sizeStiffness: number;
    /** 크기 스프링 감쇠 (작을수록 말랑하게 출렁임) */
    sizeDamping: number;
    /** 0–1. 움직이는 방향으로 늘어나는 정도 (squash & stretch) */
    stretch: number;
    /** 0–1. 가장자리가 젤리처럼 출렁이는 정도 */
    wobble: number;
    /** 떠난 자리와 이어지는 끈적한 목의 굵기 (px, 0 = 없음) */
    neck: number;
    /** 0–1. 창 가장자리 안쪽 빛 */
    edge: number;
  };
  /** 상황이 바뀔 때 따라가는 빠르기 (클수록 빠릿함) */
  motion: {
    /** 흐름 · 빛 · 질감 값 */
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
  "spin",
  "boost",
  "intensity",
  "glow",
  "haze",
  "brightness",
  "softness",
  "colorRandom",
  "flowScale",
  "scale",
  "breathe",
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
  flow: base.flow,
  panel: base.panel,
  morph: base.morph,
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
