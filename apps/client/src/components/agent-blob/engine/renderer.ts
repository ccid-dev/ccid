// AgentBlob 렌더러: 상황(idle · hover · press · listening · thinking · speaking)에 따라 값을 옮기고
// flow 구(engine/flow-orb.ts)를 그립니다.
// 상황마다 값 묶음이 있고, JS 가 매 프레임 지금 값을 목표 값 쪽으로 부드럽게 옮기며 시간을 누적합니다(T += dt × spin).
// 그래서 상황이 바뀌어도 튀지 않습니다. CSS 키프레임이나 time × speed 직접 계산으로 바꾸지 마세요.
// 대화 창으로 펼치면 구가 창을 덮을 만큼 커지고, 창 모양으로 잘립니다(BlobCanvas).

import {
  type BlobConfig,
  type BlobPreset,
  type BlobSituation,
  type BlobState,
  BLOB_PRESET_KEYS,
  DEFAULT_BLOB_CONFIG,
} from "./config";
import { createFlowOrb, type FlowOrbDrawer } from "./flow-orb";

export interface BlobRendererOptions {
  canvas: HTMLCanvasElement;
  /** 매 프레임 --blob-scale CSS 변수를 받는 요소 */
  host?: HTMLElement;
  /** 보이는 구(또는 펼친 창) 크기의 기준 요소. 기본은 host */
  sizeRef?: HTMLElement;
  config?: BlobConfig;
  /** 움직임 줄이기 설정을 따를지 (기본 true) */
  respectReducedMotion?: boolean;
}

export interface BlobFrameValues {
  scale: number;
  haze: number;
  level: number;
}

/** 매 프레임 목표 쪽으로 옮겨 가는 값들 */
type Animated = BlobPreset & { level: number; sphere: number };

/** 실제 음성 크기가 없을 때 쓰는 가짜 음성 곡선 */
export function simulatedLevel(state: BlobState, t: number): number {
  if (state === "listening")
    return Math.max(
      0,
      0.35 +
        0.35 * Math.sin(t * 7.1) * Math.sin(t * 2.3) +
        0.2 * Math.sin(t * 13.7),
    );
  if (state === "speaking") {
    const syl = Math.max(0, Math.sin(t * 9.0));
    return 0.25 + 0.6 * syl * syl * (0.6 + 0.4 * Math.sin(t * 1.7));
  }
  return 0;
}

export class BlobRenderer {
  readonly supported: boolean;
  private canvas: HTMLCanvasElement;
  private host?: HTMLElement;
  private sizeRef?: HTMLElement;
  private orb: FlowOrbDrawer | null;
  private cfg: BlobConfig;
  private reduce = false;
  private raf = 0;
  private last = 0;
  /** 누적 시간 (흐름) */
  private T = Math.random() * 100;
  private visible = true;
  private io?: IntersectionObserver;
  private mq?: MediaQueryList;

  state: BlobState = "idle";
  hover = false;
  press = false;
  expanded = false;
  /** 실제 음성 크기 0–1 (숫자, 또는 매 프레임 읽는 함수). null = 가짜 음성 곡선 */
  level: number | (() => number) | null = null;
  /** 매 프레임 콜백 (host 밖의 무언가를 같이 움직일 때) */
  onFrame?: (v: BlobFrameValues) => void;

  private cur: Animated;

  constructor(opts: BlobRendererOptions) {
    this.canvas = opts.canvas;
    this.host = opts.host;
    this.sizeRef = opts.sizeRef ?? opts.host;
    this.cfg = opts.config ?? DEFAULT_BLOB_CONFIG;
    this.cur = { ...this.cfg.situations.idle, level: 0, sphere: 1 };

    if (
      opts.respectReducedMotion !== false &&
      typeof matchMedia !== "undefined"
    ) {
      this.mq = matchMedia("(prefers-reduced-motion: reduce)");
      this.reduce = this.mq.matches;
      this.mq.addEventListener?.("change", this.onMq);
    }

    this.orb = createFlowOrb(this.canvas, this.cfg.flow);
    this.supported = this.orb !== null;

    this.io = new IntersectionObserver(([e]) => {
      if (!e) return;
      this.visible = e.isIntersecting;
      if (this.visible) this.start();
    });
    this.io.observe(this.canvas);
    document.addEventListener("visibilitychange", this.onVis);
    this.start();
  }

  setConfig(cfg: BlobConfig) {
    this.cfg = cfg;
    this.orb?.setLook(cfg.flow);
  }
  getConfig() {
    return this.cfg;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.io?.disconnect();
    this.mq?.removeEventListener?.("change", this.onMq);
    document.removeEventListener("visibilitychange", this.onVis);
    this.orb?.destroy();
    this.orb = null;
  }

  // ---------------------------------------------------------------- 내부
  private onVis = () => {
    if (!document.hidden) this.start();
  };
  private onMq = (e: MediaQueryListEvent) => {
    this.reduce = e.matches;
  };

  private start() {
    if (!this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    }
  }

  /** 지금 따라갈 상황: 펼쳐지지 않았을 때는 누름 > 올림 > 상태 */
  private situation(): BlobSituation {
    if (!this.expanded && this.press) return "press";
    if (!this.expanded && this.hover) return "hover";
    return this.state;
  }

  private frame = (now: number) => {
    this.raf = 0;
    if (!this.visible || document.hidden) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const { situations, voice, motion, panel } = this.cfg;
    const key = this.situation();
    const p = situations[key];
    const c = this.cur;
    const ease = (k: keyof Animated, target: number, rate: number) => {
      c[k] += (target - c[k]) * (1 - Math.exp(-rate * dt));
    };

    const src = this.level;
    const rawLevel = this.reduce
      ? 0
      : typeof src === "function"
        ? src()
        : (src ?? simulatedLevel(this.state, now / 1000));
    ease("level", rawLevel, 14);

    // 상황 값 → 지금 값 (크기는 아래에서 따로)
    for (const k of BLOB_PRESET_KEYS) {
      if (k === "scale") continue;
      ease(k, p[k], k === "haze" ? motion.ease * 1.5 : motion.ease);
    }
    ease("sphere", this.expanded ? 0 : 1, 5);
    const breathe = this.reduce ? 0 : c.breathe * Math.sin((now / 1000) * 1.6);
    ease(
      "scale",
      this.expanded ? 1 : p.scale + breathe + c.level * voice.levelScale,
      key === "press" ? motion.scaleEase * 2.4 : motion.scaleEase,
    );
    // 원본: 움직임 줄이기면 시간을 멈춤 → 아주 천천히만 흐르게
    this.T += dt * c.spin * (this.reduce ? 0.05 : 1);

    const haze = (c.haze + c.level * voice.levelHaze) * c.sphere;
    this.host?.style.setProperty("--blob-scale", c.scale.toFixed(4));
    this.onFrame?.({ scale: c.scale, haze, level: c.level });

    // 구 지름: 닫힌 구 = 상자 크기 · 펼친 창 = 창 대각선 × fill
    const box = this.sizeRef ?? this.canvas;
    const w = box.clientWidth;
    const h = box.clientHeight;
    const closed = Math.min(w, h);
    const open = Math.hypot(w, h) * panel.fill;
    this.orb?.draw({
      time: this.T,
      boost: c.boost,
      intensity: Math.min(1, c.intensity + c.level * voice.levelIntensity),
      glow: c.glow,
      haze,
      brightness: c.brightness + c.level * voice.levelBrightness,
      softness: c.softness,
      colorRandom: c.colorRandom,
      flowScale: c.flowScale,
      diameter: open + (closed - open) * c.sphere,
    });
    this.raf = requestAnimationFrame(this.frame);
  };
}
