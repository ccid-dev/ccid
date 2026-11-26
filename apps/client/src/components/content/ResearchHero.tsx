"use client";

import classNames from "classnames";
import { useRef, useState } from "react";
import type { Swiper as SwiperInstance } from "swiper";
import { A11y, Keyboard, Mousewheel } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

/** 분야 번호 → 이미지 아래 그라데이션 색. 지금은 모든 분야가 진보라(#24202e, 이전 푸터 색) — 분야 색으로 되돌릴 땐 from-theme-NN/90 (클래스는 통째로 적어야 Tailwind 가 만들어 줍니다) */
const GRADIENT: Record<number, string> = {
  1: "from-[#24202e]/90",
  2: "from-[#24202e]/90",
  3: "from-[#24202e]/90",
  4: "from-[#24202e]/90",
};

const twoDigits = (n: number) => String(n).padStart(2, "0");

/**
 * 리서치 상세 맨 위 히어로: 화면 끝까지 닿는 큰 이미지. (Figma 비율 1440:912, 단 높이는 화면 높이(svh)를 넘지 않고 넘치는 이미지는 잘림 — object-cover)
 * - 이미지 위에는 제목 · 세부 분야 글을 두지 않음 (제목은 아래 본문 머리말에). 여러 장이면 아래에 옅은 그라데이션 + 이전 · 다음
 * - 이미지는 Swiper 로 가로로 넘어갑니다: 드래그 · 스와이프 · 트랙패드 가로 스크롤(휠) · ← → 키 · 오른쪽 아래 이전 · 01 / 15 · 다음
 *   (세로 스크롤은 페이지 스크롤에 양보 · 끝 장에서 더 밀면 페이지가 계속 움직임)
 * - 헤더는 이미지 위에 겹치고, 위쪽에 진보라 그라데이션을 깔아 헤더 글자를 흰색으로 바꿈 (data-header-tone="dark")
 */
export function ResearchHero({
  images,
  alt,
  number,
  label,
  prevLabel,
  nextLabel,
}: {
  images: string[];
  alt: string;
  /** 분야 번호 (그라데이션 색) */
  number: number;
  /** 이미지 묶음 이름 (스크린리더용) */
  label: string;
  prevLabel: string;
  nextLabel: string;
}) {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [index, setIndex] = useState(0);
  const count = images.length;

  const arrow = (by: -1 | 1) => (
    <button
      type="button"
      aria-label={by === -1 ? prevLabel : nextLabel}
      disabled={by === -1 ? index === 0 : index === count - 1}
      onClick={() =>
        by === -1
          ? swiperRef.current?.slidePrev()
          : swiperRef.current?.slideNext()
      }
      className={classNames(
        "group size-10",
        "flex items-center justify-center",
        "rounded-full bg-[#ebebeb]/60 text-black backdrop-blur transition duration-300 hover:bg-white active:bg-white",
        "disabled:pointer-events-none disabled:opacity-30",
        "font-neuehaas",
      )}
    >
      <span
        aria-hidden
        className={classNames(
          "transition-transform duration-300",
          by === -1
            ? "group-hover:-translate-x-0.5 group-active:-translate-x-0.5"
            : "group-hover:translate-x-0.5 group-active:translate-x-0.5",
        )}
      >
        {by === -1 ? "←" : "→"}
      </span>
    </button>
  );

  return (
    <section
      aria-label={label}
      // 헤더가 이 히어로 위에 있는 동안 흰 글자 · 본문(밝은 바탕)으로 넘어가면 원래 색으로 (HeaderTone)
      data-header-tone="dark"
      className={classNames(
        "h-[62svh] min-h-96 md:h-[min(calc(100vw*912/1440),100svh)]",
        "relative overflow-hidden",
        "bg-sheet",
      )}
    >
      <Swiper
        modules={[A11y, Keyboard, Mousewheel]}
        speed={600}
        grabCursor
        keyboard={{ enabled: true }}
        // 트랙패드 가로 스크롤(휠)로 넘기기: 세로 스크롤은 페이지에 양보하고, 첫 · 마지막 장에서는 페이지로 돌려줌
        mousewheel={{ forceToAxis: true, releaseOnEdges: true }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={(swiper) => setIndex(swiper.activeIndex)}
        className={classNames("h-full! w-full!")}
      >
        {images.map((image, i) => (
          <SwiperSlide key={image}>
            <img
              src={image.split("#")[0]}
              alt={i === index ? alt : ""}
              decoding="async"
              loading={i === 0 ? "eager" : "lazy"}
              className={classNames("size-full object-cover")}
            />
          </SwiperSlide>
        ))}
      </Swiper>
      {/*
        위쪽: 푸터처럼 진보라(#24202e) 그라데이션 — 흰 헤더 글자가 읽히게
      */}
      <div
        aria-hidden
        className={classNames(
          "pointer-events-none absolute inset-x-0 top-0 z-10 h-44",
          "bg-linear-to-b from-[#24202e]/80 to-transparent",
        )}
      />
      {count > 1 ? (
        <div
          className={classNames(
            // 층은 드래그를 막지 않고(pointer-events-none), 버튼만 눌림
            "pointer-events-none absolute inset-x-0 bottom-0 z-10",
            "flex items-end justify-end",
            // 좌우: 사이트 바깥 여백(헤더 로고 · 아래 본문과 같은 세로줄) — 좁은 20px · 중간부터 40px
            "px-5 pt-24 pb-6 md:px-10 md:pb-10",
            // 이전 · 다음이 화면 오른쪽 아래 에이전트 구를 피함 — 단, 배너가 화면 아래 끝까지 차서 구와 만날 때만
            //   (세로로 긴 태블릿 · 폰은 배너가 화면 중간에서 끝나 구가 배너 아래에 있으므로 비우지 않음 → 오른쪽이 휑하지 않게)
            // 중간 화면부터: 배너 높이 = min(화면 폭 × 912/1440, 화면 높이). 화면이 가로 7 : 세로 5 보다 넓으면 배너 아래 끝이
            //   구 높이(아래 88px) 안까지 내려옴 → 구 오른쪽 위치 32 + 구 56 + 바깥 여백 40 = 128px (pr-32)
            //   (구 위치 · 크기는 Layout.tsx 의 AgentBlob: right-5 · md:right-8, size 56)
            "md:[@media(min-aspect-ratio:7/5)]:pr-32",
            // 흰 쪽수(01 / 15)가 읽히도록 아래에만 옅게
            "bg-linear-to-t to-transparent",
            GRADIENT[number] ?? "from-black/70",
            "text-white",
          )}
        >
          <div
            className={classNames(
              "pointer-events-auto flex shrink-0 items-center gap-3",
              // 좁은 화면: 배너가 화면 62% 높이(최소 384px)라 보통은 구와 만나지 않음.
              //   화면 높이가 460px 이하(작은 폰을 가로로)일 때만 배너 아래 끝이 구 높이(아래 76px) 안까지 내려오므로 구를 피함
              //   구 오른쪽 위치 20 + 구 56 + 바깥 여백 20 = 96px → 상자 여백 20 에 76px 더 (mr-19)
              "max-md:[@media(max-height:28.75rem)]:mr-19",
            )}
          >
            {arrow(-1)}
            <p
              aria-live="polite"
              className={classNames(
                "min-w-14 text-center",
                "font-neuehaas text-sm font-medium tabular-nums",
              )}
            >
              {twoDigits(index + 1)} / {twoDigits(count)}
            </p>
            {arrow(1)}
          </div>
        </div>
      ) : null}
    </section>
  );
}
