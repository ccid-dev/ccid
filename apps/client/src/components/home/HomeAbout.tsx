"use client";

import classNames from "classnames";
import { useState } from "react";
import type { Dictionary } from "@/i18n";
import { StrategySteps } from "./StrategySteps";

const twoDigits = (n: number) => String(n).padStart(2, "0");

/**
 * 홈 About: 큰 한 줄 소개 · 짧은 본문 두 단 · 역량 목록.
 * 역량은 흐린 큰 글자 목록이고, 마우스를 올리거나(포커스 · 탭) 고른 것만 진해지며 옆에 설명이 나옵니다.
 */
export function HomeAbout({ dict }: { dict: Dictionary }) {
  const { lead, body, capabilitiesTitle, capabilities } = dict.about;
  const [active, setActive] = useState(0);
  const current = capabilities[active];

  return (
    <div className={classNames("flex flex-col gap-16 md:gap-24")}>
      {/* 오른쪽 모션은 너비(화면 크기마다 고정) · 4:3 비율 고정, 왼쪽 글은 남는 너비 전부 */}
      <div
        className={classNames(
          "grid gap-8",
          "md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:items-start md:gap-10",
          "lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]",
          "xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]",
          "2xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]",
        )}
      >
        <div className={classNames("min-w-0", "flex flex-col gap-10")}>
          <p
            className={classNames(
              "text-xl leading-snug font-medium tracking-[-0.02em] break-keep md:text-2xl md:leading-[1.3]",
            )}
          >
            {lead}
          </p>
          <p className={classNames("leading-7 break-keep text-sub")}>{body}</p>
        </div>
        {/* Design Strategy: 단계가 계단처럼 이어지는 모션 */}
        <div
          className={classNames(
            "aspect-[4/3] w-full",
            "rounded-3xl bg-gray-100",
            "p-4 md:p-5",
          )}
        >
          <StrategySteps />
        </div>
      </div>

      <div
        className={classNames(
          "grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-10",
        )}
      >
        <div>
          <h3
            className={classNames(
              "mb-5",
              "font-neuehaas text-sm font-medium text-sub",
            )}
          >
            {capabilitiesTitle}
          </h3>
          <ul className={classNames("flex flex-col")}>
            {capabilities.map((capability, index) => (
              <li key={capability.name}>
                <button
                  type="button"
                  aria-pressed={index === active}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onClick={() => setActive(index)}
                  className={classNames(
                    "py-0.5",
                    "cursor-default transition",
                    "text-left font-neuehaas text-2xl leading-tight font-medium tracking-[-0.02em] md:text-3xl",
                    index === active
                      ? "text-main"
                      : "text-gray-300 hover:text-gray-500",
                  )}
                >
                  {capability.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {current ? (
          <div
            aria-live="polite"
            className={classNames(
              "max-w-md self-start md:sticky md:top-24 md:mt-11",
              "flex flex-col gap-3",
            )}
          >
            <span
              className={classNames(
                "font-neuehaas text-sm font-medium text-sub",
              )}
            >
              {twoDigits(active + 1)}
            </span>
            <p className={classNames("text-xl leading-snug font-medium")}>
              {current.name}
            </p>
            <p className={classNames("leading-7 break-keep text-sub")}>
              {current.description}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
