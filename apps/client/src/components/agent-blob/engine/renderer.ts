// AgentBlob 렌더러: 상황(idle · hover · press · listening · thinking · speaking)에 따라 값을 옮기고
// flow 구(engine/flow-orb.ts)를 그립니다.
// 상황마다 값 묶음이 있고, JS 가 매 프레임 지금 값을 목표 값 쪽으로 부드럽게 옮기며 시간을 누적합니다(T += dt × spin).
// 그래서 상황이 바뀌어도 튀지 않습니다. CSS 키프레임이나 time × speed 직접 계산으로 바꾸지 마세요.
// 대화 창으로 펼치는 방법은 두 가지입니다.
// - expanded: 구가 창을 덮을 만큼 커지고, 상자(CSS) 모양으로 잘립니다. (튜닝 페이지 예전 방식)
// - morph: 구가 직접 창 모양으로 바뀝니다. 위치 · 크기를 스프링으로 움직이고, 모양 셰이더(flow-orb.ts)가
//   원 → 둥근 사각형 · 떠난 자리와 이어지는 끈적한 목 · 방향으로 늘어남 · 가장자리 출렁임을 그립니다.

import {
  type BlobConfig,
  type BlobPreset,
  type BlobSituation,
  type BlobState,
  BLOB_PRESET_KEYS,
  DEFAULT_BLOB_CONFIG,
} from "./config";
import { createFlowOrb, type FlowOrbDrawer } from "./flow-orb";

/** 캔버스 왼쪽 위 기준 상자 (CSS px) */
export interface MorphRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 모핑: 닫힌 구 자리와 열린 창 자리 (둘 다 캔버스 기준). open 이 바뀌면 스프링으로 옮겨 갑니다. */
export interface Morph {
  open: boolean;
  closed: MorphRect;
  panel: MorphRect;
}

/** 스프링 하나 (값 · 속도) */
interface Spring {
  x: number;
  v: number;
}
const spring = (x: number): Spring => ({ x, v: 0 });
/** 용수철 + 감쇠 한 걸음 (반암시적 오일러) */
const step = (s: Spring, target: number, k: number, c: number, dt: number) => {
  s.v += (-k * (s.x - target) - c * s.v) * dt;
  s.x += s.v * dt;
};
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** 모양: 중심 · 반쪽 크기 스프링 */
type MorphShape = { x: Spring; y: Spring; hw: Spring; hh: Spring };

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
  /** 모핑이 끝까지 옮겨 가 멈췄을 때 (open = 열린 창에서 멈춤) */
  onMorphSettle?: (open: boolean) => void;

  private morphTarget: Morph | null = null;
  /** 모양 스프링: 중심 · 반쪽 크기 */
  private shape: MorphShape | null = null;
  private settled = true;

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

  /**
   * 모핑 시작 · 목표 바꾸기. null 이면 모핑을 끕니다(닫힌 구로 돌아가 캔버스가 다시 작아졌을 때).
   * 처음 켤 때는 닫힌 구 자리에서 시작합니다.
   */
  setMorph(morph: Morph | null) {
    const prev = this.morphTarget;
    this.morphTarget = morph;
    if (!morph) {
      this.shape = null;
      return;
    }
    if (!this.shape) {
      const r = morph.closed;
      this.shape = {
        x: spring(r.x + r.width / 2),
        y: spring(r.y + r.height / 2),
        hw: spring(r.width / 2),
        hh: spring(r.height / 2),
      };
    }
    if (!prev || prev.open !== morph.open) this.settled = false;
    this.expanded = morph.open;
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

    const look = {
      time: this.T,
      boost: c.boost,
      intensity: Math.min(1, c.intensity + c.level * voice.levelIntensity),
      glow: c.glow,
      haze,
      brightness: c.brightness + c.level * voice.levelBrightness,
      softness: c.softness,
      colorRandom: c.colorRandom,
      flowScale: c.flowScale,
    };

    if (this.morphTarget && this.shape) {
      this.drawMorph(look, dt, now, this.morphTarget, this.shape, c.scale);
    } else {
      // 구 지름: 닫힌 구 = 상자 크기 · 펼친 창 = 창 대각선 × fill
      const box = this.sizeRef ?? this.canvas;
      const w = box.clientWidth;
      const h = box.clientHeight;
      const closed = Math.min(w, h);
      const open = Math.hypot(w, h) * panel.fill;
      this.orb?.draw({ ...look, diameter: open + (closed - open) * c.sphere });
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  /** 모핑: 스프링으로 모양을 옮기고, 구 · 모양 셰이더를 그립니다. */
  private drawMorph(
    look: Omit<Parameters<FlowOrbDrawer["draw"]>[0], "diameter">,
    dt: number,
    now: number,
    m: Morph,
    sh: MorphShape,
    scale: number,
  ) {
    const { morph, panel } = this.cfg;
    const to = m.open ? m.panel : m.closed;
    const tx = to.x + to.width / 2;
    const ty = to.y + to.height / 2;
    const thw = to.width / 2;
    const thh = to.height / 2;

    if (this.reduce) {
      // 움직임 줄이기: 바로 그 자리로
      Object.assign(sh.x, spring(tx));
      Object.assign(sh.y, spring(ty));
      Object.assign(sh.hw, spring(thw));
      Object.assign(sh.hh, spring(thh));
    } else {
      // 짧게 나눠 계산해야 단단한 스프링도 튀지 않습니다.
      const n = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / n;
      for (let i = 0; i < n; i++) {
        step(sh.x, tx, morph.stiffness, morph.damping, h);
        step(sh.y, ty, morph.stiffness, morph.damping, h);
        // 가로 · 세로를 조금 다르게 — 젤리처럼 엇갈려 출렁입니다.
        step(sh.hw, thw, morph.sizeStiffness, morph.sizeDamping, h);
        step(sh.hh, thh, morph.sizeStiffness * 0.86, morph.sizeDamping, h);
      }
    }

    // 다 옮겨 갔는지 (멈추면 딱 맞춰 두고 알림)
    const off =
      Math.abs(sh.x.x - tx) +
      Math.abs(sh.y.x - ty) +
      Math.abs(sh.hw.x - thw) +
      Math.abs(sh.hh.x - thh);
    const speed =
      Math.abs(sh.x.v) +
      Math.abs(sh.y.v) +
      Math.abs(sh.hw.v) +
      Math.abs(sh.hh.v);
    if (!this.settled && off < 0.5 && speed < 4) {
      this.settled = true;
      this.onMorphSettle?.(m.open);
    }

    // 얼마나 열렸는지 (0 = 닫힌 구, 1 = 창). 출렁일 때 1 을 넘기도 합니다.
    const rc = Math.min(m.closed.width, m.closed.height) / 2;
    const rp = (m.panel.width + m.panel.height) / 2;
    const raw = (sh.hw.x + sh.hh.x - 2 * rc) / Math.max(1, rp - 2 * rc);
    const prog = clamp01(raw);

    // 구: 모양 중심에, 닫힌 구 지름 → 창 대각선 × fill
    const closedD = 2 * rc * scale;
    const openD = Math.hypot(m.panel.width, m.panel.height) * panel.fill;
    const diameter = Math.max(
      1,
      closedD + (openD - closedD) * Math.max(0, raw),
    );

    // 방향으로 늘어남: 빨리 움직일수록 (부피는 그대로)
    const vx = sh.x.v;
    const vy = sh.y.v;
    const v = Math.hypot(vx, vy);
    // 작은 물방울일 때만 크게 — 창이 될수록 빠르게 줄어듭니다 (큰 창이 비스듬히 늘어나면 유리판처럼 보임)
    const stretch =
      1 + Math.min(0.4, (v / 2400) * morph.stretch * 2) * (1 - prog) ** 2;
    // 가장자리 출렁임: 크기가 빨리 바뀔수록
    const sizeSpeed = Math.abs(sh.hw.v) + Math.abs(sh.hh.v);
    const wobble = Math.min(28, sizeSpeed * 0.012 * morph.wobble);
    // 떠난 자리의 물방울: 열릴수록 작아져 목이 가늘어지다 끊어집니다.
    const tail = morph.neck > 0 ? rc * scale * (1 - prog) ** 1.5 : 0;

    this.orb?.draw({
      ...look,
      diameter,
      // 화면 전체 무대라 그리는 양이 많아 해상도를 조금 낮춥니다 (흐린 그라데이션이라 차이가 거의 없음)
      maxPixelRatio: 1.5,
      center: [sh.x.x, sh.y.x],
      mask: {
        center: [sh.x.x, sh.y.x],
        half: [Math.max(1, sh.hw.x), Math.max(1, sh.hh.x)],
        // 닫힌 구는 원(반지름 = 반쪽 크기), 열릴수록 창 모서리로
        radius: rc + (panel.radius - rc) * prog,
        dir: v > 1 ? [vx / v, vy / v] : [1, 0],
        stretch,
        wobble,
        phase: (now / 1000) * 9,
        tail: [
          m.closed.x + m.closed.width / 2,
          m.closed.y + m.closed.height / 2,
          tail,
        ],
        neck: morph.neck,
        // 닫힌 구일 때는 자르지 않아 둘레 빛번짐이 그대로 보이고, 열리기 시작하면 바로 모양을 따릅니다.
        amount: clamp01(raw * 4),
        veil: panel.veil * prog,
        edge: morph.edge * prog,
      },
    });
  }
}
