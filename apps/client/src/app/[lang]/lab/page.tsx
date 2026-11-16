import classNames from "classnames";
import type { Metadata } from "next";
import Link from "next/link";
import { ThemeDot } from "@repo/common";
import { PAGE_X } from "@/components/content";
import { ROUTES } from "@/constants";
import { hasLocale, localePath } from "@/i18n";
import { getDictionary } from "@/i18n/server";
import { localeAlternates } from "@/libs/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/lab">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.lab.title,
    description: dict.lab.description,
    alternates: localeAlternates(lang, ROUTES.lab),
  };
}

/** 컬러칩이 차례로 깜빡이는 시차 (Tailwind 가 읽을 수 있게 그대로 적음) */
const DOT_DELAYS = [
  "[animation-delay:0ms]",
  "[animation-delay:250ms]",
  "[animation-delay:500ms]",
  "[animation-delay:750ms]",
];

/**
 * Lab — 곧 공개 대문.
 * 홈 첫 화면과 같은 구성: 왼쪽 아래 큰 "Lab", 오른쪽 아래 Coming soon · 소개 · 리서치로 가는 버튼.
 */
export default async function LabPage({ params }: PageProps<"/[lang]/lab">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return null;
  const dict = await getDictionary(lang);

  return (
    <div
      className={classNames(
        "min-h-[calc(100svh-4.5rem)]",
        "flex flex-col justify-end",
        PAGE_X,
        "pt-24 pb-14 md:pb-20",
      )}
    >
      <div
        className={classNames(
          "flex flex-col justify-between gap-10 md:flex-row md:items-end md:gap-12",
        )}
      >
        <h1
          className={classNames(
            "font-neuehaas text-[clamp(5rem,16vw,15rem)] leading-[0.78] font-medium tracking-[-0.05em]",
          )}
        >
          {dict.lab.title}
        </h1>

        <div className={classNames("max-w-lg", "flex flex-col gap-5")}>
          <span className={classNames("flex items-center gap-3")}>
            <span aria-hidden className={classNames("flex gap-1.5")}>
              {[1, 2, 3, 4].map((number, index) => (
                <ThemeDot
                  key={number}
                  number={number}
                  className={classNames(
                    "animate-pulse motion-reduce:animate-none",
                    DOT_DELAYS[index],
                  )}
                />
              ))}
            </span>
            <span
              className={classNames(
                "font-neuehaas text-sm font-medium uppercase",
              )}
            >
              {dict.lab.eyebrow}
            </span>
          </span>
          <p
            className={classNames(
              "text-xl leading-snug font-medium break-keep md:text-2xl",
            )}
          >
            {dict.lab.lead}
          </p>
          <p className={classNames("leading-7 break-keep text-sub")}>
            {dict.lab.description}
          </p>
          <div className={classNames("flex flex-wrap gap-2", "mt-2")}>
            <Link
              href={localePath(lang, ROUTES.research)}
              cursor-label="Open"
              className={classNames(
                "h-10",
                "inline-flex items-center",
                "px-5",
                "rounded-full bg-black transition hover:opacity-85",
                "font-neuehaas text-sm font-medium text-white",
              )}
            >
              {dict.lab.research} →
            </Link>
            <Link
              href={localePath(lang, ROUTES.home)}
              className={classNames(
                "h-10",
                "inline-flex items-center",
                "px-5",
                "rounded-full bg-sheet/60 transition hover:bg-sheet",
                "font-neuehaas text-sm font-medium",
              )}
            >
              {dict.notFound.home}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
