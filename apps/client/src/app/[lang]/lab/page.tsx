import classNames from "classnames";
import type { Metadata } from "next";
import Link from "next/link";
import { ThemeDot } from "@repo/common";
import { HeroBackground } from "@/components/home";
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

/** 텍스트 버튼: 마우스를 올리면 밑줄 · 화살표가 밀림 (홈 '전체 보기' 와 같은 모양) */
const textLink = classNames(
  "group inline-flex items-center gap-1.5",
  "font-neuehaas text-sm font-medium",
  "underline-offset-4 hover:underline",
);

/**
 * Lab — 곧 공개 대문.
 * 홈 첫 화면과 같은 틀: 움직이는 그라디언트 배경 위, 아래에 큰 "Lab" (홈 "cciD" 와 같은 크기),
 * 바로 오른쪽 글자 윗선에 Coming soon · 소개 · 리서치로 가는 텍스트 버튼.
 */
export default async function LabPage({ params }: PageProps<"/[lang]/lab">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return null;
  const dict = await getDictionary(lang);

  return (
    <div
      className={classNames(
        "relative isolate min-h-[100svh]",
        "flex flex-col justify-end",
        "px-5 md:px-10",
        "pt-24 pb-14 md:pb-20",
      )}
    >
      <HeroBackground />
      <div
        className={classNames(
          // 좁은 화면: 설명 → 글자 / 넓은 화면: 큰 "Lab" 바로 오른쪽 글자 윗선에 설명
          "flex flex-col-reverse gap-8",
          "md:flex-row md:items-start md:gap-12",
        )}
      >
        <h1
          className={classNames(
            "font-neuehaas text-[20vw] leading-[0.8] whitespace-nowrap md:text-[18vw]",
          )}
        >
          {dict.lab.title}
        </h1>

        <div
          className={classNames(
            "max-w-md md:pt-[1.5vw]",
            "flex flex-col gap-3",
          )}
        >
          <span className={classNames("flex items-center gap-2.5")}>
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
            className={classNames("font-medium break-keep text-lg 2xl:text-xl")}
          >
            {dict.lab.lead}
          </p>
          <p
            className={classNames(
              "text-sm md:text-base 2xl:text-lg",
              "leading-snug break-keep text-sub",
            )}
          >
            {dict.lab.description}
          </p>
          <div className={classNames("mt-4 flex flex-wrap gap-x-6 gap-y-2")}>
            <Link
              href={localePath(lang, ROUTES.research)}
              cursor-label="Open"
              className={textLink}
            >
              {dict.lab.research}
              <span
                aria-hidden
                className={classNames(
                  "transition-transform duration-300 group-hover:translate-x-1",
                )}
              >
                →
              </span>
            </Link>
            <Link
              href={localePath(lang, ROUTES.home)}
              className={classNames(textLink, "text-sub hover:text-main")}
            >
              {dict.notFound.home}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
