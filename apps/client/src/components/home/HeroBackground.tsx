"use client";

import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import defaults from "./hero-background.json";

/** 첫 화면 배경 값 (hero-background.json 과 같은 모양) — /hero-tune 에서 조절해 복사해 넣습니다. */
export type HeroBackgroundConfig = typeof defaults;
export const HERO_BACKGROUND_DEFAULTS: HeroBackgroundConfig = defaults;

/**
 * 홈 첫 화면 배경 — 피그마 "gradient-background" (cciD 웹 리뉴얼, node 490:3085) 를 WebGL 셰이더로.
 * 값(색 분포 · 투명도 · 모션 · 페이드)은 hero-background.json 에 있고, /hero-tune 페이지에서 조절합니다.
 *   - 바탕: 칠하지 않음 (투명 → 페이지 배경이 그대로 보임) · 위아래 가장자리는 마스크로 자연스럽게 사라짐 (fade)
 *   - circle (피그마 base-gradient): 가운데 원 · 방사형 색 3개 (위치 · 색) · 전체 투명도 · 흐림 25px
 *   - band (피그마 wide-gradient): 위아래가 휜 넓은 띠 · 가로 색 4개 (위치 · 색 · 투명도) · 흐림 53px
 *     색은 고리처럼 이어집니다 (4번 다음에 다시 1번). 1번과 4번을 같은 색으로 두면 이음매가 없습니다.
 *   좌표는 피그마 프레임(1920 × 1083) 기준이고 첫 화면 크기에 맞춰 늘립니다.
 *
 * 모션 (motion 값은 모두 배율: 1 = 기본, 0 = 끔)
 * - speed 빠르기 · drift 원 · 띠가 떠다니는 폭 · wave 띠 경계 물결 · colorShift 색 위치가 좌우로 오감
 * - cursorStrength 마우스 쪽 끌림 세기 · cursorSpeed 따라오는 빠르기 · scrollStrength 스크롤 퍼짐 · 흐려짐
 * flow · cursor · scroll 속성으로 모션을 통째로 끌 수 있습니다.
 * 화면 밖 · 탭 숨김이면 멈추고, 움직임 줄이기 설정이면 정지 화면 한 장만 그립니다.
 * WebGL 이 안 되면 CSS 그라디언트로 대신합니다.
 */
export function HeroBackground({
  config = defaults,
  flow = true,
  cursor = true,
  scroll = true,
  className,
}: {
  /** 배경 값 (없으면 hero-background.json) */
  config?: HeroBackgroundConfig;
  /** 흐름 모션 켜기 (끄면 멈춘 그라디언트) */
  flow?: boolean;
  /** 마우스 반응 켜기 */
  cursor?: boolean;
  /** 스크롤 반응 켜기 */
  scroll?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  // 최신 값을 그리기 루프에서 읽기 위한 보관함
  const latest = { config, flow, cursor, scroll };
  const latestRef = useRef(latest);
  useEffect(() => {
    latestRef.current = latest;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // 바탕을 칠하지 않고 투명하게 → 페이지 배경이 그대로 보여 경계가 생기지 않음
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
    });
    if (!gl) {
      setWebgl(false);
      return;
    }

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        console.error("[HeroBackground]", gl.getShaderInfoLog(shader));
      return shader;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setWebgl(false);
      return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const u = (name: string) => gl.getUniformLocation(program, name);
    const loc = {
      res: u("uRes"),
      t: u("uT"),
      mouse: u("uMouse"),
      scroll: u("uScroll"),
      intensity: u("uIntensity"),
      drift: u("uDrift"),
      wave: u("uWave"),
      colorShift: u("uColorShift"),
      cursorStrength: u("uCursorStrength"),
      scrollStrength: u("uScrollStrength"),
      bandPos: u("uBandPos"),
      bandAlpha: u("uBandAlpha"),
      bandColor: [0, 1, 2, 3].map((i) => u(`uBandColor${i}`)),
      circlePos: u("uCirclePos"),
      circleOpacity: u("uCircleOpacity"),
      circleColor: [0, 1, 2].map((i) => u(`uCircleColor${i}`)),
    };
    setWebgl(true);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    /** 배경은 부드러워서 화면 해상도보다 조금 낮게 그려도 충분 */
    const scale = Math.min(window.devicePixelRatio || 1, 2) * 0.75;
    let width = 0;
    let height = 0;
    const resize = () => {
      width = Math.max(1, Math.round(canvas.clientWidth * scale));
      height = Math.max(1, Math.round(canvas.clientHeight * scale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    // 마우스 (0–1, 화면 기준) · 천천히 따라오는 값
    const target = { x: 0.5, y: 0.5 };
    const mouse = { x: 0.5, y: 0.5 };
    const onPointer = (event: PointerEvent) => {
      target.x = event.clientX / window.innerWidth;
      target.y = event.clientY / window.innerHeight;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let time = Math.random() * 100;
    let last = performance.now();
    let raf = 0;
    let visible = true;

    const draw = (now: number) => {
      raf = 0;
      const { config, flow, cursor, scroll } = latestRef.current;
      const { motion } = config;
      const still = reduce.matches;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // 빠르기는 시간을 쌓는 양으로 (값을 바꿔도 튀지 않음)
      if (flow && !still) time += dt * motion.speed;
      const follow =
        cursor && !still ? 1 - Math.exp(-dt * 2.5 * motion.cursorSpeed) : 0;
      mouse.x += ((cursor ? target.x : 0.5) - mouse.x) * follow;
      mouse.y += ((cursor ? target.y : 0.5) - mouse.y) * follow;
      const progress = scroll
        ? Math.min(1, Math.max(0, window.scrollY / window.innerHeight))
        : 0;

      resize();
      gl.uniform2f(loc.res, width, height);
      gl.uniform1f(loc.t, time);
      gl.uniform2f(loc.mouse, mouse.x, mouse.y);
      gl.uniform1f(loc.scroll, progress);
      gl.uniform1f(loc.intensity, config.intensity);
      gl.uniform1f(loc.drift, motion.drift);
      gl.uniform1f(loc.wave, motion.wave);
      gl.uniform1f(loc.colorShift, motion.colorShift);
      gl.uniform1f(loc.cursorStrength, motion.cursorStrength);
      gl.uniform1f(loc.scrollStrength, motion.scrollStrength);
      // 색 분포
      const band = [0, 1, 2, 3].map((i) => config.band[i] ?? config.band[0]!);
      gl.uniform4f(
        loc.bandPos,
        band[0]!.position,
        band[1]!.position,
        band[2]!.position,
        band[3]!.position,
      );
      gl.uniform4f(
        loc.bandAlpha,
        band[0]!.opacity,
        band[1]!.opacity,
        band[2]!.opacity,
        band[3]!.opacity,
      );
      band.forEach((stop, i) =>
        gl.uniform3fv(loc.bandColor[i]!, hexToRgb(stop.color)),
      );
      const circle = [0, 1, 2].map(
        (i) => config.circle.stops[i] ?? config.circle.stops[0]!,
      );
      gl.uniform3f(
        loc.circlePos,
        circle[0]!.position,
        circle[1]!.position,
        circle[2]!.position,
      );
      gl.uniform1f(loc.circleOpacity, config.circle.opacity);
      circle.forEach((stop, i) =>
        gl.uniform3fv(loc.circleColor[i]!, hexToRgb(stop.color)),
      );
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // 움직임 줄이기면 한 장만, 아니면 보이는 동안 계속
      if (!still && visible && !document.hidden)
        raf = requestAnimationFrame(draw);
    };
    const start = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(draw);
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (visible) start();
    });
    observer.observe(canvas);
    const onVisibility = () => {
      if (!document.hidden) start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    // 움직임 줄이기 · 스크롤 퇴장은 멈춘 상태에서도 다시 그려야 해서
    const redraw = () => start();
    window.addEventListener("scroll", redraw, { passive: true });
    window.addEventListener("resize", redraw);
    reduce.addEventListener("change", redraw);
    start();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", redraw);
      window.removeEventListener("resize", redraw);
      reduce.removeEventListener("change", redraw);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // 위아래 가장자리: 투명하게 자연스럽게 사라짐 (층 경계처럼 안 보이게)
  const mask = `linear-gradient(to bottom, transparent, black ${config.fade.top}%, black ${config.fade.bottom}%, transparent)`;
  const [b0, b1, b2, b3] = config.band;

  return (
    <div
      aria-hidden
      className={classNames(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        className,
      )}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      {/* WebGL 이 준비되기 전 · 안 될 때: CSS 로 비슷한 그라디언트 */}
      {webgl !== true && b0 && b1 && b2 && b3 ? (
        <div
          className={classNames("absolute inset-0")}
          style={{
            background: `linear-gradient(90deg, ${cssColor(b0)} ${b0.position * 100}%, ${cssColor(b1)} ${b1.position * 100}%, ${cssColor(b2)} ${b2.position * 100}%, ${cssColor(b3)} ${b3.position * 100}%) center 55% / 100% 55% no-repeat`,
          }}
        />
      ) : null}
      <canvas
        ref={canvasRef}
        className={classNames("absolute inset-0 size-full")}
      />
    </div>
  );
}

const hexToRgb = (hex: string): [number, number, number] => {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
};

const cssColor = (stop: { color: string; opacity: number }) => {
  const [r, g, b] = hexToRgb(stop.color);
  return `rgb(${r * 255} ${g * 255} ${b * 255} / ${stop.opacity})`;
};

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uT;
uniform vec2 uMouse;
uniform float uScroll;
uniform float uIntensity;
uniform float uDrift;
uniform float uWave;
uniform float uColorShift;
uniform float uCursorStrength;
uniform float uScrollStrength;
// 색 분포 (hero-background.json)
uniform vec4 uBandPos;
uniform vec4 uBandAlpha;
uniform vec3 uBandColor0;
uniform vec3 uBandColor1;
uniform vec3 uBandColor2;
uniform vec3 uBandColor3;
uniform vec3 uCirclePos;
uniform float uCircleOpacity;
uniform vec3 uCircleColor0;
uniform vec3 uCircleColor1;
uniform vec3 uCircleColor2;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

// 점 여러 개를 이은 선 위의 y (x 가 a–b 구간이면 그 사이를 부드럽게)
float seg(float x, vec2 a, vec2 b) {
  return mix(a.y, b.y, smoothstep(a.x, b.x, x));
}

// band 위쪽 경계 (피그마 wide-gradient 경로를 따라 찍은 점)
float bandTop(float x) {
  if (x < 138.0) return seg(x, vec2(-81.0, 128.0), vec2(138.0, 250.0));
  if (x < 685.0) return seg(x, vec2(138.0, 250.0), vec2(685.0, 329.0));
  if (x < 1176.0) return seg(x, vec2(685.0, 329.0), vec2(1176.0, 324.0));
  if (x < 1544.0) return seg(x, vec2(1176.0, 324.0), vec2(1544.0, 286.0));
  if (x < 1802.0) return seg(x, vec2(1544.0, 286.0), vec2(1802.0, 235.0));
  return seg(x, vec2(1802.0, 235.0), vec2(1962.0, 195.0));
}
// band 아래쪽 경계
float bandBottom(float x) {
  if (x < 965.0) return seg(x, vec2(-188.0, 876.0), vec2(965.0, 694.0));
  if (x < 1292.0) return seg(x, vec2(965.0, 694.0), vec2(1292.0, 724.0));
  if (x < 1633.0) return seg(x, vec2(1292.0, 724.0), vec2(1633.0, 799.0));
  if (x < 1902.0) return seg(x, vec2(1633.0, 799.0), vec2(1902.0, 876.0));
  return seg(x, vec2(1902.0, 876.0), vec2(2011.0, 912.0));
}

// 두 색 사이 비율 (구간 길이가 0 이어도 안전하게)
float between(float t, float a, float b) {
  return clamp((t - a) / max(b - a, 0.0001), 0.0, 1.0);
}

// band 가로 색 (색 · 투명도): 위치 4개에서 색 4개
vec4 bandColor(float t) {
  vec4 c0 = vec4(uBandColor0, uBandAlpha.x);
  vec4 c1 = vec4(uBandColor1, uBandAlpha.y);
  vec4 c2 = vec4(uBandColor2, uBandAlpha.z);
  vec4 c3 = vec4(uBandColor3, uBandAlpha.w);
  if (t <= uBandPos.x) return c0;
  if (t < uBandPos.y) return mix(c0, c1, between(t, uBandPos.x, uBandPos.y));
  if (t < uBandPos.z) return mix(c1, c2, between(t, uBandPos.y, uBandPos.z));
  if (t < uBandPos.w) return mix(c2, c3, between(t, uBandPos.z, uBandPos.w));
  return c3;
}

// circle 방사형 색: 위치 3개에서 색 3개
vec3 circleColor(float t) {
  if (t <= uCirclePos.x) return uCircleColor0;
  if (t < uCirclePos.y) return mix(uCircleColor0, uCircleColor1, smoothstep(0.0, 1.0, between(t, uCirclePos.x, uCirclePos.y)));
  if (t < uCirclePos.z) return mix(uCircleColor1, uCircleColor2, smoothstep(0.0, 1.0, between(t, uCirclePos.y, uCirclePos.z)));
  return uCircleColor2;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  uv.y = 1.0 - uv.y;
  // 피그마 프레임 좌표 (1920 × 1083)
  vec2 f = uv * vec2(1920.0, 1083.0);
  // 바탕은 투명 (페이지 배경이 보임). 레이어를 premultiplied 로 쌓습니다.
  vec4 acc = vec4(0.0);

  // 흐름: 천천히 크게 일렁임 · 커서: 마우스 쪽으로 끌림 · 스크롤: 띠가 퍼지며 흐려짐
  vec2 drift = vec2(
    70.0 * sin(uT * 0.21) + 30.0 * sin(uT * 0.37 + 2.0),
    35.0 * sin(uT * 0.17 + 1.3)
  ) * uDrift + (uMouse - 0.5) * vec2(260.0, 120.0) * uCursorStrength;

  // circle: 가운데 원 · 흐림 25px
  vec2 circleCenter = vec2(960.5, 485.5) + drift * 0.5;
  float circleMask = 1.0 - smoothstep(759.5 - 50.0, 759.5 + 50.0, distance(f, circleCenter));
  float radial = distance(f, vec2(865.7, 564.3) + drift * 0.5) / 1079.9;
  float circleAlpha = clamp(circleMask * uCircleOpacity * uIntensity, 0.0, 1.0);
  acc = vec4(circleColor(radial) * circleAlpha, circleAlpha) + acc * (1.0 - circleAlpha);

  // band: 휜 띠 · 가로 색과 투명도 · 흐림 53px (경계를 넉넉히 흐리게)
  vec2 g = f - drift;
  float wave = (45.0 * sin(uT * 0.3 + g.x * 0.003) + 20.0 * sin(uT * 0.47 - g.x * 0.005)) * uWave;
  float scroll = uScroll * uScrollStrength;
  float spread = scroll * 220.0;
  float top = bandTop(g.x) + wave - spread;
  float bottom = bandBottom(g.x) - wave + spread;
  float blur = 107.0;
  float bandMask = smoothstep(top - blur, top + blur, g.y) * (1.0 - smoothstep(bottom - blur, bottom + blur, g.y));
  // 색 흐름: 띠의 색 위치가 천천히 좌우로 오감
  // 색 위치는 고리처럼 돕니다 (1 을 넘으면 0 으로) — 1번과 4번 색을 같게 두면 끊김 없이 이어져
  // 띠가 어느 쪽으로 밀려도 끝(흰색 등)이 드러나지 않습니다.
  vec4 band = bandColor(fract((g.x + 65.8) / 2057.0 + 0.08 * sin(uT * 0.13) * uColorShift));
  float bandAlpha = clamp(band.a * bandMask * uIntensity * (1.0 - clamp(scroll * 0.7, 0.0, 1.0)), 0.0, 1.0);
  acc = vec4(band.rgb * bandAlpha, bandAlpha) + acc * (1.0 - bandAlpha);

  // 계단 띠 방지용 미세 노이즈 (색이 있는 곳에만)
  acc.rgb += (hash(gl_FragCoord.xy + uT) - 0.5) / 255.0 * acc.a;
  gl_FragColor = acc;
}`;
