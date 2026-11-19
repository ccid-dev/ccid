"use client";

import classNames from "classnames";
import { useEffect, useState } from "react";

/**
 * 홈 섹션 인디케이터 (넓은 화면 오른쪽 여백). 섹션마다 점 하나, 지금 보고 있는 섹션은 검은 막대로 늘어납니다.
 * 점에 마우스를 올리면 섹션 이름이 왼쪽에 나타나고, 누르면 그 섹션으로 부드럽게 이동합니다.
 * 첫 화면을 지나면 나타나고, 첫 화면으로 돌아가면 사라집니다.
 */
export function SectionIndicator({
  items,
  label,
}: {
  items: { id: string; label: string }[];
  /** 스크린리더용 이름 (예: 섹션 이동) */
  label: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      // 화면 가운데 선을 지나고 있는 섹션 = 지금 보고 있는 섹션
      const middle = window.innerHeight / 2;
      let current: string | null = null;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        const box = el.getBoundingClientRect();
        if (box.top <= middle && box.bottom > middle) current = item.id;
      }
      const first = items[0] && document.getElementById(items[0].id);
      setVisible(
        Boolean(first && first.getBoundingClientRect().top <= middle) &&
          current !== null,
      );
      if (current) setActive(current);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [items]);

  const go = (id: string) => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <nav
      aria-label={label}
      aria-hidden={!visible}
      className={classNames(
        "fixed top-1/2 right-3 z-30 hidden -translate-y-1/2 lg:block",
        "transition-[opacity,translate] duration-500 ease-[cubic-bezier(.22,1,.36,1)]",
        visible
          ? "translate-x-0 opacity-100"
          : "pointer-events-none translate-x-3 opacity-0",
      )}
    >
      <ul className={classNames("flex flex-col items-end gap-3")}>
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <li key={item.id}>
              <button
                type="button"
                tabIndex={visible ? 0 : -1}
                aria-current={isActive ? "true" : undefined}
                onClick={() => go(item.id)}
                className={classNames(
                  "group relative flex h-4 items-center justify-end",
                )}
              >
                {/* 섹션 이름: 마우스를 올리거나 포커스하면 왼쪽에 나타남 */}
                <span
                  className={classNames(
                    "pointer-events-none absolute right-full mr-3",
                    "font-neuehaas text-sm whitespace-nowrap",
                    "rounded-full bg-background/90 px-2.5 py-1 backdrop-blur",
                    "translate-x-1 opacity-0 transition duration-300",
                    "group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100",
                  )}
                >
                  {item.label}
                </span>
                {/* 점 → 보고 있는 섹션은 막대 */}
                <span
                  aria-hidden
                  className={classNames(
                    "block h-1.5 rounded-full",
                    "transition-[width,background-color] duration-500 ease-[cubic-bezier(.22,1,.36,1)]",
                    isActive
                      ? "w-5 bg-black"
                      : "w-1.5 bg-gray-300 group-hover:bg-gray-500",
                  )}
                />
                <span className={classNames("sr-only")}>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
