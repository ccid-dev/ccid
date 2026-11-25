import classNames from "classnames";
import type { Metadata } from "next";
import { HeroBackground } from "@/components/home";
import { ROUTES } from "@/constants";
import { hasLocale } from "@/i18n";
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

/**
 * Lab — 곧 공개 대문.
 * 홈 첫 화면과 같은 틀: 움직이는 그라디언트 배경 위, 아래에 큰 "Lab" (홈 "cciD" 와 같은 크기),
 * 바로 오른쪽에 소개 · 리서치로 가는 텍스트 버튼.
 */
export default async function LabPage({ params }: PageProps<"/[lang]/lab">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return null;
  const dict = await getDictionary(lang);

  return (
    <div
      className={classNames(
        "relative isolate min-h-[100svh]",
        "flex flex-col justify-center",
        "px-5 md:px-10",
        "pt-24 pb-14 md:pb-20",
      )}
    >
      <HeroBackground />
      <div
        className={classNames(
          // 좁은 화면: 설명 → 글자 / 넓은 화면: 큰 "Lab" 바로 오른쪽 글자 윗선에 설명
          "flex flex-col gap-8",
          "md:flex-row items-center justify-center md:gap-12",
        )}
      >
        <h1
          className={classNames(
            "font-neuehaas text-[20vw] leading-none  md:text-[7vw]",
          )}
        >
          {dict.lab.title}
        </h1>

        <div
          className={classNames(
            // 예전 Coming soon 한 줄(20px) + 간격(12px) 자리를 비워 두어 첫 문장 높이를 그대로 유지
            "max-w-md ",
            "flex flex-col gap-3 ",
          )}
        >
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
        </div>
      </div>
    </div>
  );
}
