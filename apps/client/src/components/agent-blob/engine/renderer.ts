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
  /** 구 크기를 잴 상자의 크기. 매 프레임 clientWidth 를 읽으면 그때마다 레이아웃이 강제로 돌아서, 크기가 바뀔 때만 ResizeObserver 로 갱신 */
  private box = { w: 1, h: 1 };
  private ro?: ResizeObserver;
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
  /** 열림 시간 u (선형 0 = 닫힌 구, 1 = 창). 곡선을 걸어 진행도로 바꿈 — 위치 · 크기를 한 몸으로 움직이는 기준 */
  private progress = spring(0);

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

    const sizeBox = this.sizeRef ?? this.canvas;
    const measure = () => {
      this.box.w = sizeBox.clientWidth;
      this.box.h = sizeBox.clientHeight;
    };
    measure();
    this.ro = new ResizeObserver(measure);
    this.ro.observe(sizeBox);

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
      this.progress = spring(0);
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
    this.ro?.disconnect();
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
      const { w, h } = this.box;
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

    // 위치 · 가로 · 세로를 따로 움직이면 서로 속도가 달라, 닫힐 때 사각형이 길쭉하게 남은 채 구가 따로 자라나
    // 둘이 겹쳤다 합쳐져 보임. 그래서 진행도 하나(0 = 닫힌 구, 1 = 창)로 위치 · 크기를 한 몸으로 움직임.
    // 진행도는 "시간 u"(선형 0~1)에 앞뒤 대칭 곡선(ease-in-out)을 건 값: u 가 0 → 1 로 가면 열기, 1 → 0 으로 가면
    // 닫기라 같은 곡선을 정확히 거꾸로 재생함. (스프링은 열 때도 닫을 때도 "빨리 시작 · 천천히 끝"이라 닫기가 거울이 아님)
    // 중간에 다시 눌러도 u 가 있던 자리에서 곧장 반대로 가서 끊기지 않음.
    const goal = m.open ? 1 : 0;
    const clock = this.progress;
    if (this.reduce) {
      // 움직임 줄이기: 바로 그 자리로
      clock.x = goal;
    } else {
      const du = dt / Math.max(0.1, morph.duration);
      clock.x =
        goal > clock.x
          ? Math.min(goal, clock.x + du)
          : Math.max(goal, clock.x - du);
    }
    clock.v = 0;
    const u = clock.x;
    // ease-in-out (2제곱, 앞뒤 대칭): 3제곱은 시작이 너무 느려 누른 뒤 0.2초 동안 안 움직이는 듯 보임
    const t = u < 0.5 ? 2 * u ** 2 : 1 - (-2 * u + 2) ** 2 / 2;
    const mix = (from: number, toward: number) => from + (toward - from) * t;
    const nextX = mix(
      m.closed.x + m.closed.width / 2,
      m.panel.x + m.panel.width / 2,
    );
    const nextY = mix(
      m.closed.y + m.closed.height / 2,
      m.panel.y + m.panel.height / 2,
    );
    const nextHw = Math.max(1, mix(m.closed.width / 2, m.panel.width / 2));
    const nextHh = Math.max(1, mix(m.closed.height / 2, m.panel.height / 2));
    const inv = dt > 0 ? 1 / dt : 0;
    sh.x.v = (nextX - sh.x.x) * inv;
    sh.y.v = (nextY - sh.y.x) * inv;
    sh.hw.v = (nextHw - sh.hw.x) * inv;
    sh.hh.v = (nextHh - sh.hh.x) * inv;
    sh.x.x = nextX;
    sh.y.x = nextY;
    sh.hw.x = nextHw;
    sh.hh.x = nextHh;

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
    // 짧은 쪽 기준: 가로 + 세로 합으로 재면 세로로 긴 창(사이드바)에서는 폭이 이미 좁아졌는데도
    // 세로 때문에 "아직 많이 열림"으로 계산되어, 마스크 없이 큰 구 본체가 창 옆에 반투명 원으로 드러남
    const rp = Math.min(m.panel.width, m.panel.height) / 2;
    const raw = (Math.min(sh.hw.x, sh.hh.x) - rc) / Math.max(1, rp - rc);
    const prog = clamp01(raw);

    // 구: 모양 중심에, 닫힌 구 지름 → 창 대각선 × fill
    const closedD = 2 * rc * scale;
    // 구 지름: 지금 사각형을 채우는 크기(현재 대각선 × fill)를 따라가며, 구 크기에 가까워질수록 닫힌 구 크기로 모음.
    // (창 최종 크기 기준으로 재면 줄어드는 사각형 안에 구가 따로 들어 있거나 옆에 옅은 원으로 비침)
    const fillD = Math.hypot(2 * sh.hw.x, 2 * sh.hh.x) * panel.fill;
    const diameter = Math.max(
      1,
      closedD + (fillD - closedD) * clamp01(raw * 3),
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
    // 닫을 때는 만들지 않음: 닫히는 창이 돌아오는 자리에 이 물방울이 먼저 남아 있으면, 끈적한 목(neck)으로 이어져
    // 창 옆에 큰 반투명 구가 부풀어 나왔다 사라져 보임 (열 때만 쓰는 연출)
    const tail = morph.neck > 0 && m.open ? rc * scale * (1 - prog) ** 1.5 : 0;

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
        // 거의 끝(구 크기)까지 모양을 따르다 마지막에만 풀림 — 일찍 풀리면 구 본체가 사각형 옆에 따로 보임
        amount: clamp01(raw * 10),
        veil: panel.veil * prog,
        edge: morph.edge * prog,
      },
    });
  }
}
