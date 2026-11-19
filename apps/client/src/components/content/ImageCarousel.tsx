"use client";

import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import { MediaBox } from "./MediaBox";

const twoDigits = (n: number) => String(n).padStart(2, "0");

/**
 * 이미지 캐러셀: 한 번에 한 장씩 크게 보고, 다음 장이 오른쪽에 살짝 보입니다.
 * 좁은 화면은 손가락으로 넘기고(스와이프), 아래 이전 · 다음 버튼과 번호(01 / 07)로도 넘깁니다.
 * 모션: 보고 있는 장은 선명하게, 나머지는 살짝 흐리게 바뀌며 넘어갑니다.
 */
export function ImageCarousel({
  images,
  alt,
  label,
  prevLabel,
  nextLabel,
}: {
  images: string[];
  alt: string;
  label: string;
  prevLabel: string;
  nextLabel: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);

  // 스크롤 위치 → 지금 보고 있는 장
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const slides = [...track.children] as HTMLElement[];
      let nearest = 0;
      let best = Infinity;
      slides.forEach((slide, index) => {
        const distance = Math.abs(slide.offsetLeft - track.scrollLeft);
        if (distance < best) {
          best = distance;
          nearest = index;
        }
      });
      setCurrent(nearest);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      track.removeEventListener("scroll", onScroll);
    };
  }, []);

  const go = (index: number) => {
    const track = trackRef.current;
    const slide = track?.children[index] as HTMLElement | undefined;
    if (!track || !slide) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    track.scrollTo({
      left: slide.offsetLeft,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className={classNames("flex flex-col gap-4")}
    >
      <ul
        ref={trackRef}
        className={classNames(
          "relative",
          "flex snap-x snap-mandatory gap-3 overflow-x-auto",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {images.map((image, index) => (
          <li
            key={image}
            aria-roledescription="slide"
            aria-label={`${index + 1} / ${images.length}`}
            className={classNames(
              "w-[85%] shrink-0 snap-start md:w-2/3 2xl:w-1/2",
              "transition-opacity duration-500",
              index === current ? "opacity-100" : "opacity-50",
            )}
          >
            <MediaBox src={image} alt={alt} />
          </li>
        ))}
      </ul>

      <div className={classNames("flex items-center gap-3")}>
        <button
          type="button"
          aria-label={prevLabel}
          disabled={current === 0}
          onClick={() => go(current - 1)}
          className={classNames(
            "group size-9",
            "flex items-center justify-center",
            "rounded-full bg-sheet/60 transition-colors duration-300 hover:bg-black hover:text-white",
            "disabled:pointer-events-none disabled:opacity-30",
            "font-neuehaas",
          )}
        >
          <span
            aria-hidden
            className={classNames(
              "transition-transform duration-300 group-hover:-translate-x-0.5",
            )}
          >
            ←
          </span>
        </button>
        <p
          aria-live="polite"
          className={classNames(
            "min-w-16 text-center",
            "font-neuehaas text-sm font-medium tabular-nums",
          )}
        >
          {twoDigits(current + 1)}
          <span className={classNames("text-mute")}>
            {" "}
            / {twoDigits(images.length)}
          </span>
        </p>
        <button
          type="button"
          aria-label={nextLabel}
          disabled={current === images.length - 1}
          onClick={() => go(current + 1)}
          className={classNames(
            "group size-9",
            "flex items-center justify-center",
            "rounded-full bg-sheet/60 transition-colors duration-300 hover:bg-black hover:text-white",
            "disabled:pointer-events-none disabled:opacity-30",
            "font-neuehaas",
          )}
        >
          <span
            aria-hidden
            className={classNames(
              "transition-transform duration-300 group-hover:translate-x-0.5",
            )}
          >
            →
          </span>
        </button>
      </div>
    </div>
  );
}
