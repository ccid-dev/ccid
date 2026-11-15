"use client";

import classNames from "classnames";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";
import { dismissToast, toastStore, type ToastTone } from "@/libs/toast";

/** 알림 뒤에서 천천히 도는 그라데이션 (테마 색) */
const GLOW: Record<ToastTone, string> = {
  success: "from-skyblue via-purple to-skyblue",
  error: "from-gold via-pink to-gold",
};

/**
 * 오른쪽 위 알림 묶음. 레이아웃에 한 번만 둡니다.
 * 흐린 유리 바탕 위로 테마 색 그라데이션이 천천히 돌고, 메시지는 흰 글자입니다.
 */
export function Toaster() {
  const toasts = useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getSnapshot,
    toastStore.getServerSnapshot,
  );
  const reduceMotion = useReducedMotion();

  return (
    <ol
      aria-label="알림"
      className={classNames(
        "w-[calc(100%-2rem)] max-w-sm",
        "pointer-events-none fixed top-4 right-4 z-110 flex flex-col gap-2",
      )}
    >
      <AnimatePresence initial={false}>
        {toasts.map((item) => (
          <motion.li
            key={item.id}
            layout
            role={item.tone === "error" ? "alert" : "status"}
            initial={{ opacity: 0, y: -16, scale: 0.96, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{
              opacity: 0,
              scale: 0.96,
              filter: "blur(8px)",
              transition: { duration: 0.2 },
            }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className={classNames(
              "min-h-14",
              "pointer-events-auto relative isolate flex items-center gap-3 overflow-hidden",
              "py-2 pr-2 pl-4",
              "rounded-2xl bg-black/55 shadow-xl backdrop-blur-xl",
              "text-sm leading-5 text-white",
            )}
          >
            <motion.span
              aria-hidden
              animate={reduceMotion ? undefined : { rotate: 360 }}
              transition={{ repeat: Infinity, duration: 7, ease: "linear" }}
              className={classNames(
                "aspect-square w-[130%]",
                "absolute top-1/2 left-1/2 -z-10 -translate-1/2",
                ["rounded-full bg-conic opacity-35 blur-2xl", GLOW[item.tone]],
              )}
            />
            <span
              aria-hidden
              className={classNames(
                "w-4 shrink-0",
                "font-neuehaas text-base leading-none",
              )}
            >
              {item.tone === "error" ? "!" : "✓"}
            </span>
            <p className={classNames("min-w-0 flex-1", "break-keep")}>
              {item.message}
            </p>
            <button
              type="button"
              onClick={() => dismissToast(item.id)}
              className={classNames(
                "h-8 shrink-0",
                "px-3",
                "rounded-lg bg-white/10 transition hover:bg-white/20",
                "text-xs font-medium",
              )}
            >
              닫기
            </button>
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  );
}
