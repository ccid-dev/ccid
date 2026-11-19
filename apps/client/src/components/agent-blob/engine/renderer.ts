// AgentBlob WebGL 렌더러 (프레임워크 무관, 의존성 없음).
// 화면 전체 삼각형 하나에 프래그먼트 셰이더:
//   도메인 워프 심플렉스 노이즈 → 팔레트 섞기 → 가짜 구 음영(z = sqrt(1 - r²): 볼록 · 테두리 빛 · 반사광)
//   → 노이즈로 흔들리는 가장자리(덩어리 일렁임).
// 상황(idle · hover · press · listening · thinking · speaking)마다 값 묶음이 있고,
// JS 가 매 프레임 지금 값을 목표 값 쪽으로 부드럽게 옮기며 시간을 누적합니다(T += dt * speed).
// 그래서 상황이 바뀌어도 튀지 않습니다. CSS 키프레임이나 time * speed 직접 계산으로 바꾸지 마세요.

import {
  type BlobConfig,
  type BlobPreset,
  type BlobSituation,
  type BlobState,
  BLOB_PRESET_KEYS,
  DEFAULT_BLOB_CONFIG,
} from "./config";

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uT,uPh,uEnergy,uBright,uSphere,uSwirl,uMorph,uR;
uniform float uScale,uWarp1,uWarp2,uBulge,uRim,uSpec;
uniform vec3 c0,c1,c2,c3,c4;
vec3 permute(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}
float sn(vec2 v){
  const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
  vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod(i,289.);
  vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
  vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.); m=m*m; m=m*m;
  vec3 x=2.*fract(p*C.www)-1.; vec3 h=abs(x)-.5; vec3 ox=floor(x+.5); vec3 a0=x-ox;
  m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
  vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.*dot(m,g);
}
float fbm(vec2 p){ return .78*sn(p)+.22*sn(p*1.9+3.1); }
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/min(uRes.x,uRes.y);
  vec2 s=uv*2./mix(1.,uR,uSphere);
  float ang=atan(s.y,s.x); vec2 dir=vec2(cos(ang),sin(ang));
  float wob=uMorph*(.045*sn(dir*1.1+vec2(uT*.9,-uT*.6))+.018*sn(dir*2.4-vec2(uT*1.4,uT*.3)));
  float r=length(s)/(1.+wob);
  float z=sqrt(max(0.,1.-r*r));
  vec2 p=s*.5*uScale;
  p/=mix(1.,.6+.4*z,uSphere*uBulge);
  float a=uSwirl*(1.2-length(p))*1.6; p=mat2(cos(a),-sin(a),sin(a),cos(a))*p;
  float t=uT;
  vec2 q=vec2(fbm(p+vec2(0.,t)), fbm(p+vec2(5.2,1.3)-t*.8));
  vec2 w=vec2(fbm(p+uWarp1*q+vec2(1.7,9.2)+t*.6), fbm(p+uWarp1*q+vec2(8.3,2.8)-t*.5));
  float n=fbm(p+uWarp2*w)*.5+.5;
  vec3 col=mix(c0,c4,smoothstep(.15,.55,n));
  col=mix(col,c1,smoothstep(.0,.6,w.x+.15));
  col=mix(col,c2,smoothstep(.15,.75,q.y+w.y*.6)*(.75+.25*uEnergy));
  float ph=uPh;
  col=mix(col,c3,smoothstep(.35,.9,w.y-q.x*.4+.35*(s.x*cos(ph)+s.y*sin(ph))));
  col=mix(col,c1,.35*smoothstep(.4,1.,-s.x*sin(ph*.7)+s.y*cos(ph*.7)));
  col+=uBright*vec3(.9,.85,1.);
  float rim=pow(1.-z,2.5);
  float spec=smoothstep(.42,.0,length(s-vec2(-.38,.42)));
  float shade=mix(1.,.86+.14*smoothstep(-1.,.4,s.y),uSphere);
  col=col*shade+uSphere*(rim*uRim*vec3(1.,.97,1.)+spec*uSpec);
  float aa=2.5/(uR*min(uRes.x,uRes.y)*.5);
float mask=mix(1.,smoothstep(1.,1.-aa,r),uSphere);
  gl_FragColor=vec4(col*mask,mask);
}`;

const UNIFORMS = [
  "uRes",
  "uT",
  "uPh",
  "uEnergy",
  "uBright",
  "uSphere",
  "uSwirl",
  "uMorph",
  "uR",
  "uScale",
  "uWarp1",
  "uWarp2",
  "uBulge",
  "uRim",
  "uSpec",
  "c0",
  "c1",
  "c2",
  "c3",
  "c4",
] as const;
type UniformName = (typeof UNIFORMS)[number];

export interface BlobRendererOptions {
  canvas: HTMLCanvasElement;
  /** 매 프레임 --blob-scale / --blob-glow / --blob-glow-scale CSS 변수를 받는 요소 */
  host?: HTMLElement;
  /** 보이는 구 지름의 기준 요소 (캔버스는 이보다 넓게 번질 수 있음). 기본은 host */
  sizeRef?: HTMLElement;
  config?: BlobConfig;
  /** 움직임 줄이기 설정을 따를지 (기본 true) */
  respectReducedMotion?: boolean;
}

export interface BlobFrameValues {
  scale: number;
  glow: number;
  glowScale: number;
  level: number;
}

/** 매 프레임 목표 쪽으로 옮겨 가는 값들 */
type Animated = BlobPreset & { level: number; sphere: number };

const hexToRgb = (h: string): [number, number, number] => {
  const x = h.replace("#", "");
  const v =
    x.length === 3
      ? x
          .split("")
          .map((c) => c + c)
          .join("")
      : x;
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
};

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
  private gl: WebGLRenderingContext | null = null;
  private loc = {} as Record<UniformName, WebGLUniformLocation | null>;
  private cfg: BlobConfig;
  private reduce = false;
  private raf = 0;
  private last = 0;
  /** 누적 시간 (흐름) */
  private T = Math.random() * 100;
  /** 누적 위상 (색 회전). colorOrbit 이 바뀌어도 튀지 않도록 따로 쌓습니다. */
  private phase = Math.random() * Math.PI * 2;
  private visible = true;
  private ro?: ResizeObserver;
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

    this.supported = this.init();
    this.canvas.addEventListener(
      "webglcontextlost",
      this.onLost as EventListener,
    );
    this.canvas.addEventListener("webglcontextrestored", this.onRestored);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.canvas);
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
    this.applyColors();
  }
  getConfig() {
    return this.cfg;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.ro?.disconnect();
    this.io?.disconnect();
    this.mq?.removeEventListener?.("change", this.onMq);
    document.removeEventListener("visibilitychange", this.onVis);
    this.canvas.removeEventListener(
      "webglcontextlost",
      this.onLost as EventListener,
    );
    this.canvas.removeEventListener("webglcontextrestored", this.onRestored);
    // GPU 컨텍스트는 캔버스가 실제로 화면에서 빠졌을 때만 바로 반납합니다.
    // React StrictMode(dev)는 같은 캔버스로 정리 → 다시 마운트하는데, 이때 끊어 버리면
    // getContext 가 끊긴 컨텍스트를 그대로 돌려줘 셰이더 컴파일이 실패합니다.
    if (!this.canvas.isConnected) {
      this.gl?.getExtension("WEBGL_lose_context")?.loseContext();
    }
    this.gl = null;
  }

  // ---------------------------------------------------------------- 내부
  private onVis = () => {
    if (!document.hidden) this.start();
  };
  private onMq = (e: MediaQueryListEvent) => {
    this.reduce = e.matches;
  };
  private onLost = (e: Event) => {
    e.preventDefault();
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  };
  private onRestored = () => {
    this.init();
    this.start();
  };

  private init(): boolean {
    const gl = this.canvas.getContext("webgl", {
      premultipliedAlpha: true,
      antialias: false,
      alpha: true,
    });
    if (!gl || gl.isContextLost()) return false;
    this.gl = gl;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        console.error("[AgentBlob]", gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const ap = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(ap);
    gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
    for (const n of UNIFORMS) this.loc[n] = gl.getUniformLocation(prog, n);
    this.applyColors();
    return true;
  }

  private applyColors() {
    const gl = this.gl;
    if (!gl) return;
    for (let i = 0; i < 5; i++) {
      const color = this.cfg.colors[i] ?? this.cfg.colors[0] ?? "#ffffff";
      gl.uniform3fv(this.loc[`c${i}` as UniformName], hexToRgb(color));
    }
  }

  private resize() {
    const gl = this.gl;
    if (!gl) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const k = this.expanded ? 0.5 : dpr; // 펼친 패널 배경은 부드러워서 절반 해상도로 충분
    const w = Math.max(1, Math.round(this.canvas.clientWidth * k));
    const h = Math.max(1, Math.round(this.canvas.clientHeight * k));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

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
    if (!this.visible || document.hidden) {
      return;
    }
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

    // 상황 값 → 지금 값 (모양 관련은 아래에서 따로)
    for (const k of BLOB_PRESET_KEYS) {
      if (k === "scale" || k === "morph") continue;
      const rate =
        k === "swirl"
          ? motion.ease * 0.75
          : k === "glow" || k === "glowScale"
            ? motion.ease * 1.5
            : motion.ease;
      const target = k === "speed" && this.reduce ? 0.04 : p[k];
      ease(k, target, rate);
    }
    ease("sphere", this.expanded ? 0 : 1, 5);
    ease(
      "morph",
      this.expanded
        ? 0
        : this.reduce
          ? p.morph * 0.3
          : p.morph + c.level * voice.levelMorph,
      6,
    );
    const breathe = this.reduce ? 0 : c.breathe * Math.sin((now / 1000) * 1.6);
    ease(
      "scale",
      this.expanded ? 1 : p.scale + breathe + c.level * voice.levelScale,
      key === "press" ? motion.scaleEase * 2.4 : motion.scaleEase,
    );
    this.T += dt * c.speed;
    this.phase += dt * c.speed * c.colorOrbit;

    const glowScale = c.glowScale + c.level * voice.levelGlow;
    if (this.host) {
      this.host.style.setProperty("--blob-scale", c.scale.toFixed(4));
      this.host.style.setProperty("--blob-glow", c.glow.toFixed(3));
      this.host.style.setProperty("--blob-glow-scale", glowScale.toFixed(4));
    }
    this.onFrame?.({ scale: c.scale, glow: c.glow, glowScale, level: c.level });

    const gl = this.gl;
    if (gl && !gl.isContextLost()) {
      this.resize();
      const L = this.loc;
      const box = this.sizeRef?.clientWidth ?? this.canvas.clientWidth;
      gl.uniform2f(L.uRes, this.canvas.width, this.canvas.height);
      gl.uniform1f(L.uT, this.T);
      gl.uniform1f(L.uPh, this.phase);
      gl.uniform1f(L.uEnergy, c.energy);
      gl.uniform1f(L.uBright, c.level * voice.levelBrightness);
      gl.uniform1f(L.uSphere, c.sphere);
      gl.uniform1f(L.uSwirl, c.swirl);
      gl.uniform1f(L.uMorph, c.morph);
      gl.uniform1f(L.uR, Math.min(1, box / (this.canvas.clientWidth || 1)));
      gl.uniform1f(
        L.uScale,
        panel.noiseScale + (c.noiseScale - panel.noiseScale) * c.sphere,
      );
      gl.uniform1f(L.uWarp1, c.warp1);
      gl.uniform1f(L.uWarp2, c.warp2);
      gl.uniform1f(L.uBulge, c.bulge);
      gl.uniform1f(L.uRim, c.rim);
      gl.uniform1f(L.uSpec, c.specular);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    this.raf = requestAnimationFrame(this.frame);
  };
}
