"use client";

import classNames from "classnames";
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import defaults from "./footer-background.json";
import { render, setup } from "./moving-gradient";

/** 푸터 배경 값 (footer-background.json 과 같은 모양) — /footer-tune 에서 조절해 복사해 넣습니다. */
export type FooterBackgroundConfig = typeof defaults;
export const FOOTER_BACKGROUND_DEFAULTS: FooterBackgroundConfig = defaults;

/**
 * 튜닝 페이지에서 바꾼 값을 실제 푸터에 바로 보여 주기 위한 저장소.
 * (푸터는 레이아웃에 있어서 튜닝 페이지가 props 로 넘길 수 없음) 평소에는 비어 있어 json 값을 씁니다.
 */
let liveConfig: FooterBackgroundConfig | null = null;
const listeners = new Set<() => void>();
export const footerBackgroundLive = {
  set(config: FooterBackgroundConfig | null) {
    liveConfig = config;
    for (const listener of listeners) listener();
  },
  get: () => liveConfig,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

const hexToRgba = (hex: string, a = 1) => {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return {
    r: ((n >> 16) & 255) / 255,
    g: ((n >> 8) & 255) / 255,
    b: (n & 255) / 255,
    a,
  };
};

/** 값 파일의 셰이더 값 → Figma 셰이더 params 모양 */
const toShaderParams = (shader: FooterBackgroundConfig["shader"]) => ({
  intensity: shader.intensity,
  detail: shader.detail,
  twist: shader.twist,
  warp: shader.warp,
  zoom: shader.zoom,
  rotationSpeed: shader.rotationSpeed,
  morphSpeed: shader.morphSpeed,
  gradientBalance: shader.gradientBalance,
  gradientMethod: shader.gradientMethod,
  material: shader.material,
  gradient: {
    stops: [...shader.colors]
      .sort((a, b) => a.position - b.position)
      .map((stop) => ({
        position: stop.position,
        color: hexToRgba(stop.color),
      })),
  },
});

/**
 * 성능 예산. 픽셀마다 무거운 연산(7번 반복 + 표면 법선)을 하는 셰이더라 "그리는 픽셀 수 × 초당 프레임"이 곧 부하입니다.
 * 부드러운 그라디언트는 낮은 해상도로 그려 CSS 로 늘려도 거의 차이가 없어서, 픽셀 수와 프레임을 제한합니다.
 * - 큰 화면(마우스): 최대 90만 픽셀 · 30fps
 * - 터치 화면(폰 · 태블릿): 최대 20만 픽셀 · 20fps
 */
const BUDGET = {
  fine: { pixels: 900_000, fps: 30, dpr: 1.5 },
  coarse: { pixels: 200_000, fps: 20, dpr: 1 },
};
const budgetNow = () =>
  window.matchMedia("(pointer: coarse)").matches ? BUDGET.coarse : BUDGET.fine;

/**
 * Figma 셰이더(moving-gradient)를 canvas 에 그립니다 (WebGPU).
 * 화면에 보일 때만 움직이고, 움직임 줄이기 설정이면 한 장만 그립니다.
 * WebGPU 가 없는 브라우저에서는 아무것도 그리지 않아 아래 기본 그라디언트만 보입니다.
 */
function MovingGradient({
  params,
  className,
  style,
}: {
  params: ReturnType<typeof toShaderParams>;
  className?: string;
  style?: CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 그리기 루프가 매 프레임 최신 값을 읽도록 (값이 바뀌어도 셰이더를 다시 만들지 않음)
  const paramsRef = useRef(params);
  const redrawRef = useRef<() => void>(() => {});
  useEffect(() => {
    paramsRef.current = params;
    redrawRef.current();
  }, [params]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gpu = typeof navigator !== "undefined" ? navigator.gpu : undefined;
    if (!canvas || !gpu) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let disposed = false;
    let raf = 0;
    let visible = false;
    let device: GPUDevice | null = null;
    let context: GPUCanvasContext | null = null;
    const frame = {
      state: {} as Record<string, unknown>,
      params: paramsRef.current as Record<string, unknown>,
      time: 0,
      output: null as GPUTexture | null,
    };
    let start = 0;

    const resize = () => {
      const budget = budgetNow();
      const dpr = Math.min(window.devicePixelRatio || 1, budget.dpr);
      const max = device?.limits.maxTextureDimension2D ?? 4096;
      let w = canvas.clientWidth * dpr;
      let h = canvas.clientHeight * dpr;
      // 픽셀 수가 예산을 넘으면 비율을 지켜 줄임 (CSS 가 원래 크기로 늘려 보여 줌)
      const over = Math.sqrt((w * h) / budget.pixels);
      if (over > 1) {
        w /= over;
        h /= over;
      }
      canvas.width = Math.max(1, Math.min(max, Math.round(w)));
      canvas.height = Math.max(1, Math.min(max, Math.round(h)));
    };

    const draw = (now: number) => {
      if (!device || !context) return;
      if (!start) start = now;
      frame.time = reduce ? 0 : now - start;
      frame.params = paramsRef.current;
      frame.output = context.getCurrentTexture();
      render(device, frame);
    };
    let lastDraw = -Infinity;
    const tick = (now: number) => {
      // 프레임 상한: 상한보다 빨리 오면 그리지 않고 다음 프레임을 기다림 (화면 갱신은 그대로 60fps 로 부드럽게 보임)
      const interval = 1000 / budgetNow().fps;
      if (reduce || now - lastDraw >= interval - 1) {
        lastDraw = now;
        draw(now);
      }
      raf =
        visible && !reduce && !document.hidden
          ? requestAnimationFrame(tick)
          : 0;
    };
    /** 다음 프레임에 그리기 (이미 돌고 있으면 그대로) */
    const request = () => {
      if (!raf && device) raf = requestAnimationFrame(tick);
    };
    redrawRef.current = request;

    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (visible) request();
    });
    const sizer = new ResizeObserver(() => {
      resize();
      request();
    });
    const onVisibility = () => {
      if (!document.hidden && visible) request();
    };
    document.addEventListener("visibilitychange", onVisibility);

    void (async () => {
      const adapter = await gpu.requestAdapter();
      if (!adapter || disposed) return;
      device = await adapter.requestDevice();
      if (disposed) {
        device.destroy();
        return;
      }
      context = canvas.getContext("webgpu") as GPUCanvasContext | null;
      if (!context) return;
      context.configure({
        device,
        format: gpu.getPreferredCanvasFormat(),
        alphaMode: "premultiplied",
      });
      resize();
      setup(device, frame);
      observer.observe(canvas);
      sizer.observe(canvas);
    })().catch(() => {
      // WebGPU 를 못 쓰면 기본 그라디언트만
    });

    return () => {
      disposed = true;
      redrawRef.current = () => {};
      cancelAnimationFrame(raf);
      observer.disconnect();
      sizer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      device?.destroy();
    };
  }, []);

  return (
    <canvas ref={canvasRef} aria-hidden className={className} style={style} />
  );
}

/**
 * 푸터 배경: Figma 그라디언트 (cciD 웹 리뉴얼 · node 496:3206) 를 푸터에 맞춘 것.
 * 아래부터: 가로 그라디언트 → 일렁이는 셰이더 (가장자리가 흐린 사각 마스크) → 보라 빛 번짐 두 개.
 * 위쪽은 투명하게 사라져서 흰 본문과 끊기지 않게 이어집니다.
 * 값은 footer-background.json 에 있고, /footer-tune 페이지에서 조절합니다.
 */
export function FooterBackground() {
  // 마우스 화면에서만 blur 필터 (서버에서는 true 로 그려 hydration 이 어긋나지 않게 두고, 터치 기기는 마운트 뒤 끔)
  const fine = useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia("(pointer: coarse)");
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    () => !window.matchMedia("(pointer: coarse)").matches,
    () => true,
  );
  const live = useSyncExternalStore(
    footerBackgroundLive.subscribe,
    footerBackgroundLive.get,
    () => null,
  );
  const config = live ?? FOOTER_BACKGROUND_DEFAULTS;
  // 값이 같으면 같은 객체 (셰이더 루프가 쓸데없이 다시 그리지 않게)
  const paramsKey = JSON.stringify(config.shader);
  const params = useMemo(
    () =>
      toShaderParams(JSON.parse(paramsKey) as FooterBackgroundConfig["shader"]),
    [paramsKey],
  );

  const base = config.base
    .map((stop) => {
      const { r, g, b } = hexToRgba(stop.color);
      return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${stop.opacity}) ${stop.position * 100}%`;
    })
    .join(",");

  return (
    <div
      aria-hidden
      style={{ "--fade": `${config.fade}%` } as CSSProperties}
      className={classNames(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        // 위는 흰 바탕과 이어지게: 위 0% 투명 → --fade 부터 다 보임
        "[mask-image:linear-gradient(to_bottom,transparent,black_var(--fade))]",
      )}
    >
      {/* 가로 그라디언트 (image 54) */}
      <div
        style={{ backgroundImage: `linear-gradient(90deg,${base})` }}
        className={classNames("absolute inset-0")}
      />
      {/* 일렁이는 셰이더 (Figma 1920×755 프레임 기준 비율) */}
      <div
        className={classNames(
          "absolute top-0 -left-[0.42%] h-[107.5%] w-[100.42%]",
        )}
      >
        <MovingGradient
          params={params}
          // 흐림: 덩어리 경계를 부드럽게 (px)
          style={{
            opacity: config.shader.opacity,
            // blur 필터는 매 프레임 움직이는 큰 면에 걸면 가장 무거움 → 터치 화면에서는 끔 (낮은 해상도로 늘려 이미 부드러움)
            filter: fine ? `blur(${config.shader.blur}px)` : undefined,
          }}
          className={classNames(
            "absolute -inset-x-[8.82%] -inset-y-[20.94%] h-[141.88%] w-[117.64%]",
            "[mask-image:url(/img/footer/mask.png)] [mask-size:100%_100%] [mask-repeat:no-repeat]",
          )}
        />
      </div>
      {/* 보라 빛 번짐 두 개 */}
      <img
        alt=""
        src="/img/footer/glow-line.svg"
        style={{ opacity: config.glow }}
        className={classNames(
          "absolute top-[3.84%] left-[57.92%] h-[69.27%] w-[12.31%]",
          "max-w-none scale-x-[1.445] scale-y-[1.2012]",
        )}
      />
      <img
        alt=""
        src="/img/footer/glow-ellipse.svg"
        style={{ opacity: config.glow }}
        className={classNames(
          "absolute -top-[1.99%] left-[63.49%] h-[48.48%] w-[10.31%]",
          "max-w-none scale-x-[1.699] scale-y-[1.3782]",
        )}
      />
    </div>
  );
}
