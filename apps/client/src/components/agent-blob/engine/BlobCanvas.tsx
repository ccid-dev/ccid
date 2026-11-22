"use client";

import {
  type CSSProperties,
  forwardRef,
  type ReactNode,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type BlobConfig,
  type BlobState,
  DEFAULT_BLOB_CONFIG,
  type DeepPartial,
  mergeBlobConfig,
} from "./config";
import { type BlobFrameValues, BlobRenderer } from "./renderer";

export interface BlobCanvasProps {
  /** 에이전트 상태. 바뀔 때 항상 부드럽게 옮겨 갑니다. */
  state?: BlobState;
  /**
   * 음성 크기 0–1. 숫자, 또는 매 프레임 읽는 함수(useMicLevel). 함수는 React 를 다시 그리지 않습니다.
   * 없으면 listening · speaking 에서 가짜 음성 곡선을 씁니다.
   */
  level?: number | (() => number);
  /** true = 구가 커지며 창(모달 배경)을 덮고, 창 모양으로 잘립니다. */
  expanded?: boolean;
  /** 전체 또는 일부 설정. 없으면 presets/*.json */
  config?: DeepPartial<BlobConfig>;
  /** 둘레 빛번짐이 잘리지 않게 캔버스를 구보다 넓게 그리는 여백 (구 크기 대비 비율, 0.5 = 양쪽 50%) */
  bleed?: number;
  /** 마우스 올림 · 누름에 반응할지 (기본 true) */
  interactive?: boolean;
  /** 올림 · 누름 상황을 강제로 보여 줍니다 (튜닝 페이지 미리보기용). */
  force?: "hover" | "press";
  className?: string;
  style?: CSSProperties;
  /** 그라데이션 위에 올릴 내용 (펼쳤을 때 대화 창 내용 등) */
  children?: ReactNode;
  onFrame?: (v: BlobFrameValues) => void;
}

export interface BlobCanvasHandle {
  renderer: BlobRenderer | null;
}

const EASE = "cubic-bezier(.22,1,.36,1)";

/**
 * 살아 있는 그라데이션 구. 부모 상자를 꽉 채웁니다 — 부모 크기를 정해 주세요.
 * 의미(버튼 등)는 바깥에서 감싸 주세요. 화면에서는 AgentBlob 을 쓰면 됩니다.
 */
export const BlobCanvas = forwardRef<BlobCanvasHandle, BlobCanvasProps>(
  function BlobCanvas(
    {
      state = "idle",
      level,
      expanded = false,
      config,
      bleed = 0.5,
      interactive = true,
      force,
      className,
      style,
      children,
      onFrame,
    },
    ref,
  ) {
    const hostRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<BlobRenderer | null>(null);
    const [supported, setSupported] = useState<boolean | null>(null);

    // config 객체가 렌더마다 새로 만들어져도 내용이 같으면 다시 합치지 않도록 JSON 으로 비교합니다.
    const configKey = JSON.stringify(config ?? null);
    const cfg = useMemo(
      () =>
        mergeBlobConfig(
          JSON.parse(configKey) as DeepPartial<BlobConfig> | null,
          DEFAULT_BLOB_CONFIG,
        ),
      [configKey],
    );
    const cfgRef = useRef(cfg);

    useImperativeHandle(
      ref,
      () => ({
        get renderer() {
          return rendererRef.current;
        },
      }),
      [],
    );

    // 마운트 · 해제 (렌더러는 한 번만 만들고, 이후 값은 아래에서 넘깁니다)
    useEffect(() => {
      if (!canvasRef.current || !hostRef.current) return;
      const r = new BlobRenderer({
        canvas: canvasRef.current,
        host: hostRef.current,
        config: cfgRef.current,
      });
      rendererRef.current = r;
      setSupported(r.supported);
      return () => {
        r.destroy();
        rendererRef.current = null;
      };
    }, []);

    // props → 렌더러 (다시 만들지 않음)
    useEffect(() => {
      cfgRef.current = cfg;
      rendererRef.current?.setConfig(cfg);
    }, [cfg]);
    useEffect(() => {
      if (rendererRef.current) rendererRef.current.state = state;
    }, [state]);
    useEffect(() => {
      if (rendererRef.current) rendererRef.current.level = level ?? null;
    }, [level]);
    useEffect(() => {
      if (rendererRef.current) rendererRef.current.expanded = expanded;
    }, [expanded]);
    useEffect(() => {
      if (rendererRef.current) rendererRef.current.onFrame = onFrame;
    }, [onFrame]);
    useEffect(() => {
      const r = rendererRef.current;
      if (!r) return;
      r.hover = force === "hover" || force === "press";
      r.press = force === "press";
    }, [force]);

    const set = (k: "hover" | "press", v: boolean) => {
      if (rendererRef.current && interactive && !force)
        rendererRef.current[k] = v;
    };
    const { colorA, colorB, colorC, colorWarm } = cfg.flow;
    const { radius, veil } = cfg.panel;

    return (
      <div
        ref={hostRef}
        className={className}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          ...style,
        }}
        onPointerEnter={() => set("hover", true)}
        onPointerLeave={() => {
          set("hover", false);
          set("press", false);
        }}
        onPointerDown={() => set("press", true)}
        onPointerUp={() => set("press", false)}
        onFocus={() => set("hover", true)}
        onBlur={() => set("hover", false)}
      >
        {/* 구 · 펼치면 창 모양으로 잘림 */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: expanded ? 0 : `${-bleed * 100}%`,
            borderRadius: expanded ? radius : 0,
            overflow: expanded ? "hidden" : "visible",
            transform: "scale(var(--blob-scale, 1))",
            transition: `inset .7s ${EASE}, border-radius .7s ${EASE}`,
            pointerEvents: "none",
          }}
        >
          {/* CSS 대체 화면: 첫 그리기(JS 전) · WebGL 이 안 되는 기기 */}
          {supported !== true && (
            <div
              style={{
                position: "absolute",
                // 넓힌 면(1 + 2 × bleed) 안에서 원래 구 자리
                inset: expanded ? 0 : `${(bleed / (1 + 2 * bleed)) * 100}%`,
                borderRadius: expanded ? radius : "50%",
                background: `radial-gradient(45% 40% at 50% 75%, ${colorB}, transparent 70%), radial-gradient(40% 40% at 75% 50%, ${colorWarm}, transparent 70%), radial-gradient(40% 45% at 25% 60%, ${colorC}, transparent 70%), ${colorA}`,
              }}
            />
          )}
          <canvas
            ref={canvasRef}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              display: "block",
            }}
          />
          {/* 펼친 창: 글자가 잘 보이도록 덮는 흰색 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#fff",
              opacity: expanded ? veil : 0,
              transition: `opacity .5s ${EASE}`,
            }}
          />
        </div>
        {children != null && (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {children}
          </div>
        )}
      </div>
    );
  },
);
