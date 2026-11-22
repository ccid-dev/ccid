"use client";

import classNames from "classnames";
import { type CSSProperties, useRef, useState } from "react";
import type { Dictionary } from "@/i18n";
import { StrategySteps } from "./StrategySteps";
import { scrollToStep, useScrollStep } from "./useScrollStep";

/**
 * 홈 About: 큰 한 줄 소개 · 짧은 본문 두 단 · 역량 목록.
 * 역량은 흐린 큰 글자 목록이고, 고른 것만 진해지며 옆에 설명이 나옵니다.
 * - 넓은 화면(1024+): 스크롤하는 만큼 메뉴가 하나씩 넘어갑니다. (구역을 메뉴 수만큼 길게 + 안쪽 화면 고정)
 *   메뉴를 누르면 그 메뉴 자리로 스크롤합니다.
 * - 중간 화면: 마우스를 올리거나 누르면 바뀜 · 좁은 화면: 메뉴 아래로 펼쳐지는 아코디언
 */
export function HomeAbout({ dict }: { dict: Dictionary }) {
  const { lead, body, capabilitiesTitle, capabilities } = dict.about;
  const [active, setActive] = useState(0);
  const current = capabilities[active];
  const trackRef = useRef<HTMLDivElement>(null);
  useScrollStep(trackRef, capabilities.length, setActive);
  const isWide = () => window.matchMedia("(min-width: 1024px)").matches;

  return (
    <div className={classNames("flex flex-col gap-16 md:gap-24")}>
      {/* 넓은 화면: 내용 8칸 중 글 5칸 · 모션 3칸 (사이트 그리드 칸에 맞춤). 중간 화면은 1.5 : 1 */}
      <div
        className={classNames(
          "grid gap-8",
          "md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:items-start md:gap-10",
          "lg:grid-cols-8 lg:gap-x-10",
        )}
      >
        <div
          className={classNames(
            "min-w-0 lg:col-span-5",
            "flex flex-col gap-10",
          )}
        >
          <p
            className={classNames(
              "text-2xl leading-snug break-keep md:text-3xl 2xl:text-4xl",
            )}
          >
            {lead}
          </p>
          <p className={classNames("text-base leading-7 break-keep text-sub")}>
            {body}
          </p>
        </div>
        {/* Design Strategy: 단계가 계단처럼 이어지는 모션 */}
        <div
          className={classNames(
            "aspect-[4/3] w-full lg:col-span-3",
            "rounded-3xl bg-gray-100",
            "p-4 md:p-5",
          )}
        >
          <StrategySteps />
        </div>
      </div>

      {/*
        넓은 화면: 메뉴 수 × 화면 40% 만큼 길게 + 안쪽을 화면에 고정 → 스크롤하는 만큼 메뉴가 넘어감.
        (--steps = 메뉴 수. 높이 계산에만 씁니다)
      */}
      <div
        ref={trackRef}
        style={{ "--steps": capabilities.length } as CSSProperties}
        className={classNames("lg:h-[calc(var(--steps)*40svh+100svh)]")}
      >
        <div
          className={classNames(
            "lg:sticky lg:top-0 lg:flex lg:h-svh lg:items-center",
          )}
        >
          {/* 넓은 화면: 역량 목록 4칸 · 설명 4칸 */}
          <div
            className={classNames(
              "grid w-full gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-10",
              "lg:grid-cols-8 lg:gap-x-10",
            )}
          >
            <div className={classNames("lg:col-span-4")}>
              <h3
                className={classNames("mb-3", "font-neuehaas text-sm text-sub")}
              >
                {capabilitiesTitle}
              </h3>
              <ul className={classNames("flex flex-col")}>
                {capabilities.map((capability, index) => (
                  <li key={capability.name}>
                    <button
                      type="button"
                      aria-pressed={index === active}
                      // 넓은 화면은 스크롤이 고르므로, 올림은 중간 화면에서만 · 누르면 그 메뉴 자리로 스크롤
                      onMouseEnter={() => {
                        if (!isWide()) setActive(index);
                      }}
                      onFocus={() => setActive(index)}
                      onClick={() => {
                        if (isWide())
                          scrollToStep(
                            trackRef.current,
                            capabilities.length,
                            index,
                          );
                        else setActive(index);
                      }}
                      className={classNames(
                        "w-full py-0.5",
                        "flex items-center justify-between gap-4",
                        "cursor-default lg:cursor-pointer",
                        "transition-[color,translate] duration-500 ease-[cubic-bezier(.22,1,.36,1)]",
                        "text-left font-neuehaas text-3xl leading-tight md:text-5xl min-[1920px]:text-6xl",
                        // 스크롤로 고른 것 = 진한 색 / 마우스만 올린 것 = 살짝 오른쪽으로 밀리고 한 톤만 진해짐
                        index === active
                          ? "text-main"
                          : "text-gray-300 lg:hover:translate-x-3 lg:hover:text-gray-400",
                      )}
                    >
                      {capability.name}
                      {/* 좁은 화면: 펼침 표시 (+ → ×) */}
                      <span
                        aria-hidden
                        className={classNames(
                          "shrink-0 md:hidden",
                          "text-2xl font-light transition-transform duration-500",
                          index === active && "rotate-45",
                        )}
                      >
                        +
                      </span>
                    </button>
                    {/* 좁은 화면: 메뉴 바로 아래로 설명이 펼쳐짐 (아코디언) */}
                    <div
                      className={classNames(
                        "grid md:hidden",
                        "transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(.22,1,.36,1)]",
                        index === active
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0",
                      )}
                    >
                      <div className={classNames("overflow-hidden")}>
                        <p
                          className={classNames(
                            "pt-2 pb-6",
                            "text-base leading-7 break-keep text-sub",
                          )}
                        >
                          {capability.description}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {current ? (
              <div
                key={active}
                aria-live="polite"
                className={classNames(
                  "max-w-md self-start md:sticky md:top-24 md:mt-8 lg:static lg:col-span-4",
                  // 좁은 화면은 메뉴 아래 아코디언으로 보여 주므로 숨김
                  "hidden md:flex md:flex-col md:gap-2",
                  // 바뀔 때마다 살짝 떠오르며 나타남
                  "transition-[opacity,translate] duration-500 ease-[cubic-bezier(.22,1,.36,1)]",
                  "starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none",
                )}
              >
                <p className={classNames("text-xl font-medium")}>
                  {current.name}
                </p>
                <p
                  className={classNames(
                    "text-base leading-7 break-keep text-sub",
                  )}
                >
                  {current.description}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
