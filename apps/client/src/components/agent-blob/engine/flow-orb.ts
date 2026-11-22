// flow 구 그리기 — 보내주신 flow cursor(원본 flow-cursor.js, 레포에는 없음)를 그대로 옮긴 것.
// 셰이더(flow-orb-shaders.ts) · 구 · 빛번짐 판 · 카메라 · 매 프레임 uniform 계산은 원본 그대로이고,
// 매 프레임 값(시간 · 빛 · 질감 · 구 지름)은 renderer.ts 가 상황에 맞춰 넘겨줍니다.
// 원본과 다른 점:
// - 마우스 따라가기 · 빨리 움직일 때 꼬리(streak)는 뺐습니다.
// - 구 위치는 캔버스 가운데, 지름은 px 로 받습니다. (닫힌 구 = 상자 크기, 대화 창 = 창을 덮는 크기)
// - boost · intensityBoost: 원본 cursor 는 1 · 0 고정, 여기서는 상황별 값.
// - premultipliedAlpha: 원본은 false. 검은 배경에서 쓰던 값이라 흰 배경에서는 빛번짐이 회색으로 탁해져 true 로 둡니다.

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
}

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

  return {
    setLook(next) {
      look = next;
    },
    draw(f) {
      // 캔버스 크기 (대화 창으로 펼칠 때 계속 바뀜)
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      if (w !== width || h !== height) {
        width = w;
        height = h;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
      // 구 지름 px → 카메라에서 보이는 크기 (원본: settings.size / innerHeight × 보이는 높이)
      group.scale.setScalar(
        Math.max(((f.diameter / h) * viewHeight) / 2, 0.02),
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
      renderer.render(scene, camera);
    },
    destroy() {
      scene.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          (node.material as THREE.Material).dispose();
        }
      });
      renderer.dispose();
    },
  };
}
