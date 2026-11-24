// flow 구 그리기 — 보내주신 flow cursor(원본 flow-cursor.js, 레포에는 없음)를 그대로 옮긴 것.
// 셰이더(flow-orb-shaders.ts) · 구 · 빛번짐 판 · 카메라 · 매 프레임 uniform 계산은 원본 그대로이고,
// 매 프레임 값(시간 · 빛 · 질감 · 구 지름)은 renderer.ts 가 상황에 맞춰 넘겨줍니다.
// 원본과 다른 점:
// - 마우스 따라가기 · 빨리 움직일 때 꼬리(streak)는 뺐습니다.
// - 구 위치는 캔버스 가운데, 지름은 px 로 받습니다. (닫힌 구 = 상자 크기, 대화 창 = 창을 덮는 크기)
// - boost · intensityBoost: 원본 cursor 는 1 · 0 고정, 여기서는 상황별 값.
// - premultipliedAlpha: 원본은 false. 검은 배경에서 쓰던 값이라 흰 배경에서는 빛번짐이 회색으로 탁해져 true 로 둡니다.
// - 모핑(대화 창으로 열고 닫기): 구를 캔버스 안 아무 곳에 놓을 수 있고(center), 그린 뒤 모양 셰이더(MASK_FRAGMENT)로
//   한 번 더 그려 원 → 둥근 사각형 · 끈적한 목 · 젤리 출렁임 · 흰 덮개 · 가장자리 빛을 입힙니다. 구 셰이더 원문은 그대로입니다.

import * as THREE from "three";
import type { BlobBase } from "./config";
import {
  HAZE_FRAGMENT,
  HAZE_VERTEX,
  SPHERE_FRAGMENT,
  SPHERE_VERTEX,
} from "./flow-orb-shaders";

/** 한 프레임에 넘기는 값 */
export interface FlowOrbFrame {
  /** 누적 시간 (원본: time += dt × spin) */
  time: number;
  boost: number;
  intensity: number;
  glow: number;
  haze: number;
  brightness: number;
  softness: number;
  colorRandom: number;
  flowScale: number;
  /** 구 지름 (CSS px) */
  diameter: number;
  /** 화면 해상도 배율 상한 (기본 2) */
  maxPixelRatio?: number;
  /** 구 중심 (CSS px, 캔버스 왼쪽 위 기준). 없으면 캔버스 가운데 */
  center?: [number, number];
  /** 모양 셰이더 (모핑 중 · 열린 창). 없으면 구만 그립니다. */
  mask?: FlowOrbMask | null;
}

/** 모양 셰이더 값 (길이는 모두 CSS px, 캔버스 왼쪽 위 기준) */
export interface FlowOrbMask {
  /** 창(둥근 사각형) 중심 · 반쪽 크기 · 모서리 */
  center: [number, number];
  half: [number, number];
  radius: number;
  /** 움직이는 방향(단위 벡터) · 그 방향으로 늘어난 배율 (1 = 그대로) */
  dir: [number, number];
  stretch: number;
  /** 가장자리 출렁임 폭 (px) · 위상 */
  wobble: number;
  phase: number;
  /** 떠난 자리의 물방울: 중심 · 반지름 (0 = 없음) · 이어지는 목 굵기 */
  tail: [number, number, number];
  neck: number;
  /** 0–1. 0 = 모양으로 자르지 않음(닫힌 구의 빛번짐 그대로), 1 = 모양 밖은 안 보임 */
  amount: number;
  /** 0–1. 모양 안을 덮는 흰색 */
  veil: number;
  /** 0–1. 가장자리 안쪽 빛 */
  edge: number;
}

const MASK_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// 원 → 둥근 사각형 SDF. 움직이는 방향으로 늘이고, 가장자리를 출렁이고, 떠난 자리의 물방울과 매끈하게 잇습니다(smooth-min).
const MASK_FRAGMENT = /* glsl */ `
uniform sampler2D tScene;
uniform vec2 uCenter;
uniform vec2 uHalf;
uniform float uRadius;
uniform vec2 uDir;
uniform float uStretch;
uniform float uWobble;
uniform float uPhase;
uniform vec3 uTail;
uniform float uNeck;
uniform float uAmount;
uniform float uVeil;
uniform float uEdge;
uniform float uPx;
varying vec2 vUv;

float sdRoundBox(vec2 p, vec2 b, float r) {
  r = min(r, min(b.x, b.y));
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float smin(float a, float b, float k) {
  if (k <= 0.0) return min(a, b);
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

void main() {
  vec4 col = texture2D(tScene, vUv);
  vec2 p = gl_FragCoord.xy - uCenter;
  vec2 perp = vec2(-uDir.y, uDir.x);
  vec2 q = uDir * dot(p, uDir) / uStretch + perp * dot(p, perp) * uStretch;
  float d = sdRoundBox(q, uHalf, uRadius);
  float a = atan(q.y, q.x);
  d -= uWobble * (0.6 * sin(3.0 * a + uPhase) + 0.4 * sin(5.0 * a - uPhase * 1.3));
  if (uTail.z > 0.5) d = smin(d, length(gl_FragCoord.xy - uTail.xy) - uTail.z, uNeck);
  float inside = clamp(0.5 - d / (1.2 * uPx), 0.0, 1.0);

  float v = uVeil * inside;
  col = col * (1.0 - v) + vec4(v);
  float rim = uEdge * inside * (1.0 - smoothstep(0.0, 16.0 * uPx, -d));
  col = vec4(col.rgb + rim * col.a, col.a);

  gl_FragColor = col * mix(1.0, inside, uAmount);
}
`;

/** 원본 카메라 */
const CAMERA = { fov: 36, z: 6.2 };

const styleValue = (style: string) =>
  style === "glass" ? 1 : style === "liquid" ? 2 : 0;

export interface FlowOrbDrawer {
  setLook(look: BlobBase["flow"]): void;
  draw(frame: FlowOrbFrame): void;
  destroy(): void;
}

/** 캔버스에 flow 구를 그릴 준비를 합니다. WebGL 이 안 되면 null. */
export function createFlowOrb(
  canvas: HTMLCanvasElement,
  initialLook: BlobBase["flow"],
): FlowOrbDrawer | null {
  let look = initialLook;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
    });
  } catch {
    return null;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, 0.1, 50);
  camera.position.set(0, 0, CAMERA.z);

  const hazeUniforms = {
    uColor: { value: new THREE.Color(look.rim) },
    uAmount: { value: 0 },
    uSpread: { value: 1.05 },
    uFade: { value: 0 },
  };
  const d5Uniforms = {
    time: { value: 0 },
    lightDir: { value: new THREE.Vector3(0.2, 0.9, 0.3).normalize() },
    ringDir: { value: new THREE.Vector3(0.08, 0.56, 0.86).normalize() },
    boost: { value: 1 },
    globalAlpha: { value: 0 },
    paletteMix: { value: 0.2 },
    intensityBoost: { value: 0 },
    uColorA: { value: new THREE.Color(look.colorA) },
    uColorB: { value: new THREE.Color(look.colorB) },
    uColorC: { value: new THREE.Color(look.colorC) },
    uColorWarm: { value: new THREE.Color(look.colorWarm) },
    uRim: { value: new THREE.Color(look.rim) },
    uAreaA: { value: look.areaA },
    uAreaB: { value: look.areaB },
    uAreaC: { value: look.areaC },
    uAreaWarm: { value: look.areaWarm },
    uAreaRim: { value: look.areaRim },
    uRandom: { value: 0 },
    uSoftness: { value: 0 },
    uBrightness: { value: 1 },
    uGlow: { value: 0 },
    uFlowSpeed: { value: look.flowSpeed },
    uFlowScale: { value: 1 },
    uStyle: { value: styleValue(look.style) },
  };

  const group = new THREE.Group();
  const board = new THREE.Group();
  const haze = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShaderMaterial({
      uniforms: hazeUniforms,
      vertexShader: HAZE_VERTEX,
      fragmentShader: HAZE_FRAGMENT,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
    }),
  );
  haze.scale.set(3.8, 3.8, 1);
  haze.renderOrder = 1;
  board.add(haze);
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 192, 192),
    new THREE.ShaderMaterial({
      uniforms: d5Uniforms,
      vertexShader: SPHERE_VERTEX,
      fragmentShader: SPHERE_FRAGMENT,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
    }),
  );
  sphere.renderOrder = 4;
  group.add(board, sphere);
  scene.add(group);

  const viewHeight = 2 * Math.tan((CAMERA.fov * Math.PI) / 360) * CAMERA.z;
  let width = 0;
  let height = 0;
  let fade = 0;

  // 모양 셰이더: 구를 따로 그린 그림(target)을 한 번 더 그립니다. 처음 모핑할 때 만듭니다.
  let target: THREE.WebGLRenderTarget | null = null;
  const maskUniforms = {
    tScene: { value: null as THREE.Texture | null },
    uCenter: { value: new THREE.Vector2() },
    uHalf: { value: new THREE.Vector2() },
    uRadius: { value: 0 },
    uDir: { value: new THREE.Vector2(1, 0) },
    uStretch: { value: 1 },
    uWobble: { value: 0 },
    uPhase: { value: 0 },
    uTail: { value: new THREE.Vector3() },
    uNeck: { value: 0 },
    uAmount: { value: 0 },
    uVeil: { value: 0 },
    uEdge: { value: 0 },
    uPx: { value: 1 },
  };
  const maskScene = new THREE.Scene();
  const maskCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  maskScene.add(
    new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms: maskUniforms,
        vertexShader: MASK_VERTEX,
        fragmentShader: MASK_FRAGMENT,
        blending: THREE.NoBlending,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      }),
    ),
  );

  return {
    setLook(next) {
      look = next;
    },
    draw(f) {
      // 캔버스 크기 (대화 창으로 펼칠 때 계속 바뀜)
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        f.maxPixelRatio ?? 2,
      );
      if (w !== width || h !== height || ratio !== renderer.getPixelRatio()) {
        width = w;
        height = h;
        renderer.setPixelRatio(ratio);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
      // 구 지름 px → 카메라에서 보이는 크기 (원본: settings.size / innerHeight × 보이는 높이)
      group.scale.setScalar(
        Math.max(((f.diameter / h) * viewHeight) / 2, 0.02),
      );
      // 구 중심 px → 카메라 앞 평면 위치 (없으면 가운데)
      const [cx, cy] = f.center ?? [w / 2, h / 2];
      group.position.set(
        ((cx - w / 2) / h) * viewHeight,
        (-(cy - h / 2) / h) * viewHeight,
        0,
      );

      // ── 원본 render() 의 구 · 빛번짐 부분 ──
      fade += (1 - fade) * 0.12;
      board.quaternion.copy(camera.quaternion);
      d5Uniforms.time.value = f.time;
      d5Uniforms.boost.value = f.boost;
      d5Uniforms.intensityBoost.value = f.intensity;
      d5Uniforms.globalAlpha.value = fade * look.opacity;
      d5Uniforms.uColorA.value.set(look.colorA);
      d5Uniforms.uColorB.value.set(look.colorB);
      d5Uniforms.uColorC.value.set(look.colorC);
      d5Uniforms.uColorWarm.value.set(look.colorWarm);
      d5Uniforms.uRim.value.set(look.rim);
      d5Uniforms.uAreaA.value = look.areaA;
      d5Uniforms.uAreaB.value = look.areaB;
      d5Uniforms.uAreaC.value = look.areaC;
      d5Uniforms.uAreaWarm.value = look.areaWarm;
      d5Uniforms.uAreaRim.value = look.areaRim;
      d5Uniforms.uRandom.value = f.colorRandom || 0;
      d5Uniforms.uSoftness.value = f.softness;
      d5Uniforms.uBrightness.value = f.brightness;
      d5Uniforms.uGlow.value = f.glow;
      d5Uniforms.uFlowSpeed.value = look.flowSpeed;
      d5Uniforms.uFlowScale.value = f.flowScale;
      d5Uniforms.uStyle.value = styleValue(look.style);
      hazeUniforms.uColor.value.set(look.rim);
      hazeUniforms.uAmount.value = 0.1 + f.haze * 0.42;
      hazeUniforms.uFade.value = fade;

      const mask = f.mask;
      if (!mask) {
        renderer.render(scene, camera);
        return;
      }
      // 모양 셰이더: 구 → target, target → 화면 (모양 · 덮개 · 가장자리 빛)
      const px = renderer.getPixelRatio();
      const bw = Math.max(1, Math.round(w * px));
      const bh = Math.max(1, Math.round(h * px));
      if (!target) target = new THREE.WebGLRenderTarget(bw, bh);
      else if (target.width !== bw || target.height !== bh)
        target.setSize(bw, bh);
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);

      const u = maskUniforms;
      // gl_FragCoord 는 기기 px · 왼쪽 아래 기준
      const toGl = (x: number, y: number) => [x * px, (h - y) * px] as const;
      u.tScene.value = target.texture;
      u.uCenter.value.set(...toGl(...mask.center));
      u.uHalf.value.set(mask.half[0] * px, mask.half[1] * px);
      u.uRadius.value = mask.radius * px;
      u.uDir.value.set(mask.dir[0], -mask.dir[1]);
      u.uStretch.value = mask.stretch;
      u.uWobble.value = mask.wobble * px;
      u.uPhase.value = mask.phase;
      u.uTail.value.set(...toGl(mask.tail[0], mask.tail[1]), mask.tail[2] * px);
      u.uNeck.value = mask.neck * px;
      u.uAmount.value = mask.amount;
      u.uVeil.value = mask.veil;
      u.uEdge.value = mask.edge;
      u.uPx.value = px;
      renderer.render(maskScene, maskCamera);
    },
    destroy() {
      target?.dispose();
      for (const root of [scene, maskScene])
        root.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            node.geometry.dispose();
            (node.material as THREE.Material).dispose();
          }
        });
      renderer.dispose();
    },
  };
}
