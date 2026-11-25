"use client";

import classNames from "classnames";
import Link from "next/link";
import {
  type CSSProperties,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { CroppedImage } from "@repo/blocks";
import { Reveal } from "@/components/content";
import { localePath, localized, type Dictionary, type Locale } from "@/i18n";
import { mediaUrl } from "@/libs/media";
import type { Theme } from "@/types";
import { useScrollStep } from "./useScrollStep";

/**
 * 홈 Research 쇼케이스 (Figma "research" 프레임).
 * - 넓은 화면(1024+): 분야 카드가 세로로 쌓여 롤링됩니다. 스크롤하는 만큼 한 칸씩 올라가고,
 *   지금 분야는 화면 가운데 · 위에 하나(첫 분야일 땐 빈 자리) · 아래에 둘이 보입니다.
 *   카드마다 이미지(자기 비율)와 오른쪽 글(번호 · 제목 · 질문 · 자세히 보기)이 한 줄로 붙어 있고,
 *   글은 지금 카드일 때만 보입니다. (글 위치를 따로 찾지 않음)
 *   크기 변화는 scale 로만 줘서 카드 높이가 변하지 않으므로, 가운데 맞춤 값은 잘 변하지 않습니다.
 *   (구역을 분야 수만큼 길게 + 안쪽 화면 고정)
 * - 좁은 화면: 큰 이미지 위 · 글 아래 세로 카드
 */
export function HomeResearch({
  themes,
  locale,
  dict,
}: {
  themes: Theme[];
  locale: Locale;
  dict: Dictionary;
}) {
  /** 스크롤로 고른 분야 */
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  useScrollStep(trackRef, themes.length, setActive);

  // 롤링: 지금 카드가 칸 가운데에 오도록 목록을 올리는 값 (카드 레이아웃 높이만 보므로 움직이는 동안 변하지 않음)
  const stageRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [shift, setShift] = useState<number | null>(null);
  const measure = useCallback(() => {
    const stage = stageRef.current;
    const item = itemRefs.current[active + 1]; // 0번은 맨 위 빈 자리
    if (!stage || !item) return;
    setShift(stage.clientHeight / 2 - (item.offsetTop + item.offsetHeight / 2));
  }, [active]);
  useLayoutEffect(() => {
    measure();
    // 이미지가 받아져 카드 높이가 생기거나 창 크기가 바뀔 때만 다시 잼
    const observer = new ResizeObserver(measure);
    if (stageRef.current) observer.observe(stageRef.current);
    if (listRef.current) observer.observe(listRef.current);
    return () => observer.disconnect();
  }, [measure]);

  // 처음 자리를 잡는 동안에는 움직임 없이, 그다음부터 부드럽게
  const [settled, setSettled] = useState(false);
  useLayoutEffect(() => {
    if (shift === null || settled) return;
    const frame = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(frame);
  }, [shift, settled]);

  if (!themes[active]) return null;
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
        {/* 좁은 화면: 세로 카드 목록 */}
        <ol className={classNames("flex flex-col gap-10 md:gap-8 lg:hidden")}>
          {themes.map((theme, index) => {
            const image = mediaUrl(theme.images[0]);
            return (
              <li key={theme.id}>
                <Reveal delay={index * 70}>
                  <Link
                    href={href(theme)}
                    className={classNames(
                      "group flex flex-col gap-4",
                      "transition duration-300 active:scale-[0.98]",
                    )}
                  >
                    {image ? (
                      <span
                        className={classNames(
                          "aspect-thumbnail w-full",
                          "relative overflow-hidden",
                          "rounded-2xl bg-sheet",
                          "[&_img]:transition-transform [&_img]:duration-700 group-active:[&_img]:scale-105",
                        )}
                      >
                        <CroppedImage src={image} alt="" />
                      </span>
                    ) : null}
                    <span className={classNames("flex flex-col gap-1")}>
                      <span
                        className={classNames(
                          "text-xl leading-snug break-keep md:text-2xl",
                        )}
                      >
                        {localized(theme, "title", locale)}
                      </span>
                      <span className={classNames("text-sm text-sub")}>
                        {localized(theme, "question", locale)}
                      </span>
                    </span>
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ol>

        {/* 넓은 화면: 롤링 카드 (위아래 가장자리는 서서히 사라짐) */}
        <div
          ref={stageRef}
          className={classNames(
            "hidden lg:block lg:h-svh w-full",
            "relative overflow-hidden",
            "[mask-image:linear-gradient(to_bottom,transparent,black_14%,black_86%,transparent)]",
          )}
        >
          <ol
            ref={listRef}
            // 올리는 값은 지금 카드를 가운데에 맞추려고 잰 값이라 inline style
            style={{ translate: `0 ${shift ?? 0}px` }}
            className={classNames(
              "flex flex-col",
              shift === null ? "opacity-0" : "opacity-100",
              settled &&
                "transition-[translate] duration-700 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none",
            )}
          >
            {/* 맨 위 빈 자리: 롤링 계산용 — 보이지 않고 공간만 차지 */}
            <li
              aria-hidden
              ref={(el) => {
                itemRefs.current[0] = el;
              }}
              className={classNames("invisible aspect-video w-1/2")}
            />
            {themes.map((theme, index) => {
              const image = mediaUrl(theme.images[0]);
              const distance = index - active;
              const isActive = distance === 0;
              // 위 1장 · 아래 2장만 보임
              const visible = distance >= -1 && distance <= 2;
              const keywords = localized(theme, "keywords", locale).join(", ");
              return (
                <li
                  key={theme.id}
                  ref={(el) => {
                    itemRefs.current[index + 1] = el;
                  }}
                  className={classNames(
                    "relative w-full py-0",
                    "transition-opacity duration-700",
                    visible ? "opacity-100" : "pointer-events-none opacity-0",
                  )}
                >
                  {/* 이미지: 왼쪽 반. 지금 카드는 1, 나머지는 작게 (scale 이라 높이는 그대로) */}
                  <Link
                    href={href(theme)}
                    cursor-label="Open"
                    aria-label={localized(theme, "title", locale)}
                    className={classNames(
                      "group block w-1/2 origin-left",
                      "relative min-h-32 overflow-hidden",
                      "rounded-2xl bg-sheet",
                      "transition-[scale,filter] duration-700 ease-[cubic-bezier(.22,1,.36,1)]",
                      isActive
                        ? "scale-100 blur-0"
                        : "scale-[.92] blur-[2.5px] hover:blur-0",
                    )}
                  >
                    {/* 이미지 자기 비율 그대로 */}
                    {image ? (
                      <img
                        src={image.split("#")[0]}
                        alt=""
                        decoding="async"
                        className={classNames("block h-auto w-full")}
                      />
                    ) : null}
                    {/* 지금 분야: 세부 분야 · 영문 제목 (분야 색 그라데이션은 뺌) */}
                    <span
                      className={classNames(
                        "absolute inset-x-0 bottom-0 flex flex-col gap-1",
                        "px-7 pt-28 pb-6",
                        "font-neuehaas font-light text-white",
                        "transition-opacity duration-500",
                        isActive ? "opacity-100" : "opacity-0",
                      )}
                    >
                      {keywords ? (
                        <span className={classNames("text-lg")}>
                          {keywords}
                        </span>
                      ) : null}
                      <span className={classNames("text-3xl")}>
                        {theme.title_en || localized(theme, "title", locale)}
                      </span>
                    </span>
                  </Link>

                  {/* 글: 이 카드의 오른쪽에 붙어 있고 지금 카드일 때만 보임 */}
                  <div
                    aria-hidden={!isActive}
                    className={classNames(
                      "absolute top-0 left-[calc(50%+2.5rem)] w-[calc(50%-2.5rem)]",
                      "flex max-w-md flex-col gap-2",
                      "transition-[opacity,filter] duration-500",
                      isActive
                        ? "opacity-100 blur-0"
                        : "pointer-events-none opacity-0 blur-sm",
                    )}
                  >
                    <span
                      className={classNames("text-2xl leading-snug break-keep")}
                    >
                      {localized(theme, "title", locale)}
                    </span>
                    <span
                      className={classNames(
                        "text-base leading-snug break-keep whitespace-pre-line text-sub",
                      )}
                    >
                      {localized(theme, "question", locale)}
                    </span>
                    <Link
                      href={href(theme)}
                      tabIndex={isActive ? 0 : -1}
                      cursor-label="Open"
                      className={classNames(
                        "mt-16 w-fit",
                        "text-sm text-sub transition-colors duration-300 hover:text-black",
                      )}
                    >
                      {dict.research.more} →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
