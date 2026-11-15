"use client";

import classNames from "classnames";
import { useState } from "react";
import type { Dictionary } from "@/i18n";

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
      <div className={classNames("max-w-4xl", "flex flex-col gap-10")}>
        <p
          className={classNames(
            "text-2xl leading-snug font-medium tracking-[-0.02em] break-keep md:text-4xl md:leading-[1.3]",
          )}
        >
          {lead}
        </p>
        <div className={classNames("grid gap-6 md:grid-cols-2 md:gap-10")}>
          {body.map((paragraph) => (
            <p
              key={paragraph}
              className={classNames("leading-7 break-keep text-sub")}
            >
              {paragraph}
            </p>
          ))}
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
