"use client";

import classNames from "classnames";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { BlobCanvas } from "./engine/BlobCanvas";
import type { BlobConfig, BlobState, DeepPartial } from "./engine/config";
import { useMicLevel } from "./engine/useMicLevel";

/** 열고 닫힐 때 크기 · 위치가 바뀌는 스프링 */
const SPRING = {
  type: "spring",
  stiffness: 260,
  damping: 30,
  mass: 0.9,
} as const;
/** 열린 대화 창 최대 크기 (px) · 화면 대비 최대 높이 비율 · 화면 가장자리 최소 여백 */
const PANEL = { width: 480, height: 600, maxHeightRatio: 0.88, edge: 20 };

export type AgentBlobLabels = {
  open: string;
  title: string;
  close: string;
  talk: string;
  send: string;
};

type CommonProps = {
  /** 구 지름 (px). 기본 40 (헤더 버튼 크기) */
  size?: number;
  /**
   * 실제 음성 인식 반응 켜기 (기본 false = 마이크를 쓰지 않음).
   * 켜면 listening 일 때 마이크 크기에 맞춰 반응합니다. 끄면 가짜 음성 곡선으로 보여 줍니다.
   */
  voice?: boolean;
  /** 설정 일부 덮어쓰기 (없으면 presets/*.json) */
  config?: DeepPartial<BlobConfig>;
  /**
   * 바깥 상자 클래스. 위치를 정해 띄울 수 있습니다. (예: "fixed right-8 bottom-8 z-20")
   * 주지 않으면 그 자리(문서 흐름)에 놓입니다.
   */
  className?: string;
};

export type AgentBlobProps = CommonProps &
  (
    | {
        /** design (기본): 올림 · 누름 반응만 있는 장식 */
        mode?: "design";
        /** 보여 줄 상태 (기본 idle) */
        state?: BlobState;
        labels?: never;
      }
    | {
        /** agent: 올림 · 누름 + 누르면 대화 창(모달)으로 커짐 */
        mode: "agent";
        state?: never;
        /** 버튼 · 대화 창 문구 (dict.agent) */
        labels: AgentBlobLabels;
      }
  );

/**
 * 에이전트 구(blob).
 * - mode="design" (기본): 마우스 올림 · 누름에만 반응합니다. 누르는 동작은 없습니다.
 * - mode="agent": 올림 · 누름 + 누르면 그 자리에서 화면 가운데 대화 창으로 커집니다.
 * 상황별 모션 값은 presets/*.json — /agent-tune 페이지(app/[lang]/agent-tune)에서 조절해 내보냅니다.
 *
 * 헤더처럼 어디에 넣어도 됩니다. 단, transform · filter · backdrop-filter 가 걸린 부모 안에 두면
 * 대화 창(position: fixed)이 화면이 아닌 그 부모 기준으로 잡히니 피해 주세요.
 */
export function AgentBlob(props: AgentBlobProps) {
  if (props.mode === "agent") return <AgentModeBlob {...props} />;
  return <DesignModeBlob {...props} />;
}

function DesignModeBlob({
  size = 40,
  voice = false,
  config,
  className,
  state = "idle",
}: CommonProps & { state?: BlobState }) {
  const listening = voice && state === "listening";
  const micLevel = useMicLevel(listening);

  return (
    <div
      aria-hidden
      className={classNames("shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <BlobCanvas
        state={state}
        level={listening ? micLevel : undefined}
        config={config}
      />
    </div>
  );
}

type Box = { top: number; left: number; width: number; height: number };

const boxOf = (el: Element): Box => {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
};

/** 화면 가운데 대화 창 자리 (스크롤바를 뺀 화면 = fixed 기준) */
const panelBox = (): Box => {
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const width = Math.min(PANEL.width, vw - PANEL.edge * 2);
  const height = Math.min(PANEL.height, vh * PANEL.maxHeightRatio);
  return { top: (vh - height) / 2, left: (vw - width) / 2, width, height };
};

const BOX_KEYS = ["top", "left", "width", "height"] as const;

/**
 * 닫혀 있을 때는 제자리(헤더 등)에 그대로 있고, 열면 같은 요소를 position: fixed 로 띄워
 * 제자리 → 화면 가운데로 키웁니다. 닫으면 다시 제자리로 줄어든 뒤 원래대로 돌아갑니다.
 * 같은 요소 · 같은 캔버스라 다시 마운트되지 않고, transform 이 아닌 width/height 를 움직여 원이 늘어나지 않습니다.
 */
function AgentModeBlob({
  size = 40,
  voice = false,
  config,
  className,
  labels,
}: CommonProps & { labels: AgentBlobLabels }) {
  const [open, setOpen] = useState(false);
  /** 제자리를 떠나 떠 있는 동안 (열림 + 닫히는 중) */
  const [floating, setFloating] = useState(false);
  const [state, setState] = useState<BlobState>("idle");
  const slotRef = useRef<HTMLDivElement>(null);
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const orbButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  /** 마지막으로 시작한 열기/닫기 (닫히는 중에 다시 열면 이전 닫기 마무리를 건너뜀) */
  const runRef = useRef(0);
  /** 한 번이라도 열렸었는지 (처음 그릴 때 오브 버튼으로 포커스를 옮기지 않도록) */
  const openedRef = useRef(false);

  const listening = voice && open && state === "listening";
  const micLevel = useMicLevel(listening);

  const openAgent = () => {
    const el = scope.current;
    const slot = slotRef.current;
    if (!el || !slot) return;
    runRef.current += 1;
    if (!floating) {
      // 제자리 위치에서 시작하도록 fixed 로 바꾸기 전에 자리를 재고, 바로 그 자리에 띄웁니다.
      const from = boxOf(slot);
      flushSync(() => setFloating(true));
      animate(el, from, { duration: 0 });
    }
    setOpen(true);
    setState("listening");
    animate(el, panelBox(), SPRING);
  };

  const closeAgent = () => {
    const el = scope.current;
    const slot = slotRef.current;
    if (!el || !slot) return;
    const run = ++runRef.current;
    setOpen(false);
    setState("idle");
    void Promise.resolve(animate(el, boxOf(slot), SPRING)).then(() => {
      if (runRef.current !== run) return;
      for (const k of BOX_KEYS) el.style.removeProperty(k);
      setFloating(false);
    });
  };

  // 열려 있는 동안: 뒤 화면 스크롤 막기 · 화면 크기가 바뀌면 창 자리 다시 맞추기
  useEffect(() => {
    if (!open) return;
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onResize = () => {
      if (scope.current) animate(scope.current, panelBox(), { duration: 0 });
    };
    window.addEventListener("resize", onResize);
    return () => {
      document.documentElement.style.overflow = overflow;
      window.removeEventListener("resize", onResize);
    };
  }, [open, animate, scope]);

  // 열리면 대화 창(닫기 버튼)으로, 닫히면 오브 버튼으로 포커스를 옮깁니다.
  useEffect(() => {
    if (open) {
      openedRef.current = true;
      closeButtonRef.current?.focus();
    } else if (openedRef.current) {
      orbButtonRef.current?.focus();
    }
  }, [open]);

  // Esc 로 닫기 · Tab 포커스를 대화 창 안에 가두기
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeButtonRef.current?.click();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    // 제자리: 떠 있는 동안에도 크기를 지켜 헤더 배치가 흔들리지 않습니다.
    <div
      ref={slotRef}
      className={classNames(
        "shrink-0",
        className,
        // 대화 창이 떠 있는 동안: 이 자리에 z-index 가 걸려 있으면(예: z-20) 모달 · 뒤 배경이 그 층에 갇혀
        // 헤더(z-40)가 위로 올라오므로, 그동안만 헤더보다 위층으로
        floating && "z-60!",
      )}
      style={{ width: size, height: size }}
    >
      {/* 뒤 배경: 흐리게 덮고, 누르면 닫힘 */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="agent-blob-backdrop"
            aria-hidden
            onClick={closeAgent}
            className={classNames(
              "fixed inset-0 z-40",
              "bg-white/50 backdrop-blur-sm",
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <div
        ref={scope}
        className={classNames(floating ? "fixed z-50" : "relative size-full")}
      >
        <BlobCanvas
          state={state}
          level={listening ? micLevel : undefined}
          expanded={open}
          interactive={!open}
          config={config}
        >
          {!open ? (
            <button
              ref={orbButtonRef}
              type="button"
              aria-label={labels.open}
              aria-haspopup="dialog"
              aria-expanded={open}
              onClick={openAgent}
              className={classNames(
                "absolute inset-0 rounded-full",
                "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple",
              )}
            />
          ) : (
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="agent-blob-title"
              className={classNames("h-full", "flex flex-col gap-3 p-4")}
              // 창이 다 커질 즈음 내용이 나타납니다.
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.35 } }}
            >
              <header
                className={classNames(
                  "flex items-center justify-between",
                  "text-primary",
                )}
              >
                <h2
                  id="agent-blob-title"
                  className={classNames("font-neuehaas text-lg font-medium")}
                >
                  {labels.title}
                </h2>
                <button
                  ref={closeButtonRef}
                  type="button"
                  aria-label={labels.close}
                  onClick={closeAgent}
                  className={classNames(
                    "size-8",
                    "flex items-center justify-center",
                    "rounded-full bg-white/60 transition hover:bg-white/80",
                  )}
                >
                  <span aria-hidden>✕</span>
                </button>
              </header>
              {/* 대화 내용 (에이전트 기능이 붙으면) */}
              <div className={classNames("flex-1 overflow-auto")} />
              {/* TODO(에이전트 연결): 지금은 listening ↔ thinking 만 바꿔 보는 버튼 */}
              <button
                type="button"
                onClick={() =>
                  setState(state === "listening" ? "thinking" : "listening")
                }
                className={classNames(
                  "mx-auto size-16",
                  "rounded-full bg-white/80 backdrop-blur transition hover:bg-white",
                  "font-neuehaas text-sm font-medium text-primary",
                )}
              >
                {state === "listening" ? labels.send : labels.talk}
              </button>
            </motion.div>
          )}
        </BlobCanvas>
      </div>
    </div>
  );
}
