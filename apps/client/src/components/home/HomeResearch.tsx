"use client";

import classNames from "classnames";
import Link from "next/link";
import { type CSSProperties, useRef, useState } from "react";
import { ThemeDot } from "@repo/common";
import { CroppedImage } from "@repo/blocks";
import { Pills, Reveal } from "@/components/content";
import { localePath, localized, type Dictionary, type Locale } from "@/i18n";
import { mediaUrl } from "@/libs/media";
import type { Theme } from "@/types";
import { useScrollStep } from "./useScrollStep";

const twoDigits = (n: number) => String(n).padStart(2, "0");

/**
 * 홈 Research 쇼케이스: 왼쪽 분야 목록 · 오른쪽 큰 이미지 · 질문 · 키워드. 누르면 분야 페이지로.
 * - 넓은 화면(1024+): 스크롤하는 만큼 분야가 하나씩 넘어가고 오른쪽 이미지가 바뀝니다.
 *   (구역을 분야 수만큼 길게 + 안쪽 화면 고정)
 *   목록에 마우스를 올리면 오른쪽 이미지 · 질문이 그 분야로 미리 바뀌고, 마우스가 목록을 떠나면 스크롤 위치의 분야로 돌아갑니다.
 *   (목록의 강조 — 바탕 면 · 검은 화살표 — 는 스크롤로 고른 분야에만. 호버는 글이 살짝 밀리는 것으로만)
 * - 좁은 화면: 큰 이미지 위 · 글 아래 세로 카드
 */
export function HomeResearch({
  themes,
  locale,
  dict,
  viewAll,
}: {
  themes: Theme[];
  locale: Locale;
  dict: Dictionary;
  /** 목록 바로 아래 '전체 보기' 링크 */
  viewAll?: { href: string; label: string };
}) {
  /** 스크롤로 고른 분야 */
  const [active, setActive] = useState(0);
  /** 마우스를 올린 분야 (없으면 null) — 오른쪽 이미지 · 질문은 이게 우선 */
  const [hovered, setHovered] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  useScrollStep(trackRef, themes.length, setActive);
  const shown = hovered ?? active;
  const current = themes[shown];
  if (!current) return null;
  const href = (theme: Theme) => localePath(locale, `/research/${theme.slug}`);

  return (
    // 넓은 화면: 분야 수 × 화면 60% 만큼 길게 + 안쪽을 화면에 고정 (--steps = 분야 수, 높이 계산에만 씀)
    <div
      ref={trackRef}
      style={{ "--steps": themes.length } as CSSProperties}
      className={classNames("lg:h-[calc(var(--steps)*60svh+100svh)]")}
    >
      <div
        className={classNames(
          "lg:sticky lg:top-0 lg:flex lg:h-svh lg:items-center",
        )}
      >
        {/* 넓은 화면: 내용 8칸 중 목록 4칸 · 이미지 4칸 */}
        <div
          className={classNames("grid w-full gap-8 lg:grid-cols-8 lg:gap-x-10")}
        >
          <div
            className={classNames(
              "flex flex-col gap-10 lg:col-span-4 lg:gap-8",
            )}
          >
            <ol
              // 목록을 떠나면 스크롤 위치의 분야로
              onMouseLeave={() => setHovered(null)}
              className={classNames("flex flex-col gap-10 md:gap-6 lg:gap-1")}
            >
              {themes.map((theme, index) => {
                const isActive = index === active;
                const image = mediaUrl(theme.images[0]);
                return (
                  <li key={theme.id}>
                    {/* 화면에 들어올 때 위에서부터 차례로 떠오름 */}
                    <Reveal delay={index * 70}>
                      <Link
                        href={href(theme)}
                        cursor-label="Open"
                        // 올리면 오른쪽 이미지 · 질문만 미리 바뀜 (목록 강조는 스크롤로 고른 분야 그대로)
                        onMouseEnter={() => setHovered(index)}
                        onFocus={() => setActive(index)}
                        className={classNames(
                          // 좁은 화면: 이미지 위 · 글 아래 세로 카드 (누를 때 살짝 작아짐) / 넓은 화면: 한 줄
                          "group flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-5",
                          "px-0 py-0 lg:px-6 lg:py-6",
                          "transition duration-300 active:scale-[0.98] lg:active:scale-100",
                          // 스크롤로 고른 것 = 바탕 면 + 검은 화살표 / 마우스만 올린 것 = 글 · 화살표가 오른쪽으로 살짝
                          ["rounded-2xl", isActive && "lg:bg-sheet/60"],
                        )}
                      >
                        {image ? (
                          <span
                            className={classNames(
                              "aspect-thumbnail w-full shrink-0 lg:hidden",
                              "relative overflow-hidden",
                              "rounded-2xl bg-sheet",
                              "[&_img]:transition-transform [&_img]:duration-700 group-hover:[&_img]:scale-105 group-active:[&_img]:scale-105",
                            )}
                          >
                            <CroppedImage src={image} alt="" />
                          </span>
                        ) : null}
                        <span
                          className={classNames(
                            "min-w-0 flex-1",
                            "flex flex-col gap-1",
                            "transition-[translate] duration-500 ease-[cubic-bezier(.22,1,.36,1)] lg:group-hover:translate-x-2",
                          )}
                        >
                          <span
                            className={classNames("flex items-center gap-2.5")}
                          >
                            <ThemeDot number={theme.number} />
                            <span
                              className={classNames(
                                "font-neuehaas text-sm font-medium text-sub",
                              )}
                            >
                              {twoDigits(theme.number)}
                            </span>
                          </span>
                          <span
                            className={classNames(
                              "text-xl leading-snug break-keep md:text-2xl",
                            )}
                          >
                            {localized(theme, "title", locale)}
                          </span>
                          {locale === "ko" && theme.title_en ? (
                            <span
                              className={classNames(
                                "font-neuehaas text-sm text-sub",
                              )}
                            >
                              {theme.title_en}
                            </span>
                          ) : null}
                        </span>
                        <span
                          aria-hidden
                          className={classNames(
                            "size-9 shrink-0 self-center",
                            // 좁은 화면은 카드 전체가 눌리는 걸로 충분해 화살표를 숨김
                            "hidden items-center justify-center lg:flex",
                            [
                              "rounded-full transition-[color,background-color,translate] duration-500 ease-[cubic-bezier(.22,1,.36,1)] lg:group-hover:translate-x-1",
                              isActive ? "bg-black text-white" : "bg-sheet/60",
                            ],
                            "font-neuehaas",
                          )}
                        >
                          →
                        </span>
                      </Link>
                    </Reveal>
                  </li>
                );
              })}
            </ol>
            {/* 전체 보기: 목록 바로 아래 (긴 스크롤 구역 끝이 아니라) */}
            {viewAll ? (
              <Link
                href={viewAll.href}
                className={classNames(
                  "group inline-flex items-center gap-1.5 self-start lg:ml-6",
                  "font-neuehaas text-sm font-medium",
                  "underline-offset-4 hover:underline",
                )}
              >
                {viewAll.label}
                <span
                  aria-hidden
                  className={classNames(
                    "transition-transform duration-300 group-hover:translate-x-1",
                  )}
                >
                  →
                </span>
              </Link>
            ) : null}
          </div>

          <Link
            href={href(current)}
            tabIndex={-1}
            aria-hidden
            className={classNames(
              "aspect-thumbnail w-full lg:col-span-4",
              "relative hidden overflow-hidden lg:block",
              "rounded-3xl bg-sheet",
            )}
          >
            {themes.map((theme, index) => {
              const image = mediaUrl(theme.images[0]);
              return image ? (
                <span
                  key={theme.id}
                  className={classNames(
                    "absolute inset-0 overflow-hidden",
                    "transition duration-700",
                    index === shown
                      ? "scale-100 opacity-100"
                      : "scale-105 opacity-0",
                  )}
                >
                  <CroppedImage src={image} alt="" lazy={false} />
                </span>
              ) : null;
            })}
            <span
              className={classNames(
                "max-w-md",
                "absolute bottom-5 left-5 flex flex-col gap-3",
                "p-5",
                "rounded-2xl bg-white/85 backdrop-blur-md",
              )}
            >
              <span
                className={classNames(
                  "text-lg leading-7 font-medium whitespace-pre-line break-keep",
                )}
              >
                {localized(current, "question", locale)}
              </span>
              {localized(current, "keywords", locale).length ? (
                <Pills items={localized(current, "keywords", locale)} />
              ) : null}
              <span className={classNames("font-neuehaas text-sm font-medium")}>
                {dict.research.more} →
              </span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
