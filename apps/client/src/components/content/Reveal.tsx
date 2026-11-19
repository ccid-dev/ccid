"use client";

import classNames from "classnames";
import { type ReactNode, useEffect, useRef, useState } from "react";

/**
 * 화면에 들어오면 한 번, 아래에서 떠오르며 나타나는 상자.
 * delay 로 순서를 줄 수 있습니다. (예: 제목 0 → 내용 120ms)
 * 움직임 줄이기 설정이면 움직임 없이 바로 보입니다.
 *
 * 나타난 뒤에는 transform 을 남기지 않습니다. (남기면 안쪽 position: fixed 요소의 기준이 바뀜)
 */
export function Reveal({
  delay = 0,
  className,
  children,
}: {
  /** 나타나기 전 기다리는 시간 (ms) */
  delay?: number;
  className?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      // 화면 아래 끝에서 조금 더 올라왔을 때 시작
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-revealed={shown}
      style={{ transitionDelay: shown ? `${delay}ms` : undefined }}
      className={classNames(
        "transition-[opacity,translate] duration-1000 ease-[cubic-bezier(.22,1,.36,1)]",
        !shown && "translate-y-6 opacity-0",
        "motion-reduce:translate-none motion-reduce:opacity-100 motion-reduce:transition-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
