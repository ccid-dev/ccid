"use client";

import classNames from "classnames";
import Link from "next/link";
import { useState } from "react";
import { ThemeDot } from "@repo/common";
import { Pills } from "@/components/content";
import { localePath, localized, type Dictionary, type Locale } from "@/i18n";
import { mediaUrl } from "@/libs/media";
import type { Theme } from "@/types";

const twoDigits = (n: number) => String(n).padStart(2, "0");

/**
 * 홈 Research 쇼케이스: 왼쪽 분야 목록에 마우스를 올리면(또는 포커스)
 * 오른쪽 큰 이미지 · 질문 · 키워드가 바뀝니다. 누르면 분야 페이지로.
 * 좁은 화면에서는 목록마다 작은 이미지가 붙습니다.
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
  const [active, setActive] = useState(0);
  const current = themes[active];
  if (!current) return null;
  const href = (theme: Theme) => localePath(locale, `/research/${theme.slug}`);

  return (
    <div
      className={classNames(
        "grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10",
      )}
    >
      <ol className={classNames("flex flex-col gap-5 md:gap-1")}>
        {themes.map((theme, index) => {
          const isActive = index === active;
          const image = mediaUrl(theme.images[0]);
          return (
            <li key={theme.id}>
              <Link
                href={href(theme)}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                className={classNames(
                  "group flex items-center gap-5",
                  "px-0 py-0 md:px-6 md:py-6",
                  [
                    "rounded-2xl transition",
                    isActive ? "lg:bg-sheet/60" : "hover:bg-sheet/40",
                  ],
                )}
              >
                {image ? (
                  <img
                    src={image}
                    alt=""
                    className={classNames(
                      "aspect-thumbnail w-24 shrink-0 lg:hidden",
                      "rounded-lg md:rounded-xl object-cover",
                    )}
                  />
                ) : null}
                <span
                  className={classNames(
                    "min-w-0 flex-1",
                    "flex flex-col gap-1",
                  )}
                >
                  <span className={classNames("flex items-center gap-2.5")}>
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
                      "text-xl leading-snug font-medium tracking-[-0.02em] break-keep md:text-2xl",
                    )}
                  >
                    {localized(theme, "title", locale)}
                  </span>
                  {locale === "ko" && theme.title_en ? (
                    <span
                      className={classNames("font-neuehaas text-sm text-sub")}
                    >
                      {theme.title_en}
                    </span>
                  ) : null}
                </span>
                <span
                  aria-hidden
                  className={classNames(
                    "size-9 shrink-0",
                    "flex items-center justify-center",
                    [
                      "rounded-full transition",
                      isActive
                        ? "bg-black text-white"
                        : "bg-sheet/60 group-hover:bg-sheet",
                    ],
                    "font-neuehaas",
                  )}
                >
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <Link
        href={href(current)}
        tabIndex={-1}
        aria-hidden
        className={classNames(
          "aspect-thumbnail w-full",
          "relative hidden overflow-hidden lg:block",
          "rounded-3xl bg-sheet",
        )}
      >
        {themes.map((theme, index) => {
          const image = mediaUrl(theme.images[0]);
          return image ? (
            <img
              key={theme.id}
              src={image}
              alt=""
              className={classNames(
                "size-full",
                "absolute inset-0 object-cover",
                "transition duration-700",
                index === active
                  ? "scale-100 opacity-100"
                  : "scale-105 opacity-0",
              )}
            />
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
  );
}
