import classNames from "classnames";
import type { Metadata } from "next";
import { CroppedImage } from "@repo/blocks";
import { InView, PageHeader, SiteNextLink } from "@/components/content";
import { ROUTES } from "@/constants";
import { hasLocale, localePath, localized } from "@/i18n";
import { getDictionary } from "@/i18n/server";
import { getThemes } from "@/libs/content";
import { mediaUrl } from "@/libs/media";
import { pageMetadata } from "@/libs/seo";

export const revalidate = 60;

/** 분야 번호 → 이미지 아래 그라데이션 색. 지금은 모든 분야가 진보라(#24202e, 이전 푸터 색) — 분야 색으로 되돌릴 땐 from-theme-NN/90 */
const GRADIENT: Record<number, string> = {
  1: "from-[#24202e]/90",
  2: "from-[#24202e]/90",
  3: "from-[#24202e]/90",
  4: "from-[#24202e]/90",
};

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/research">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata(lang, dict, {
    path: ROUTES.research,
    title: dict.research.title,
    description: dict.research.description,
  });
}

/** 리서치 분야 전체: 분야마다 한 줄 (번호 · 질문 · 요약 · 대표 이미지) — 줄 사이는 넓은 여백으로 */
export default async function ResearchIndexPage({
  params,
}: PageProps<"/[lang]/research">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return null;
  const [dict, themes] = await Promise.all([getDictionary(lang), getThemes()]);

  return (
    <>
      <PageHeader title={dict.research.title} />
      <ol
        className={classNames(
          "px-5 md:px-10",
          "flex flex-col gap-24 pt-12 pb-24 md:gap-32 lg:gap-52 lg:pt-16 lg:pb-52",
        )}
      >
        {themes.map((theme) => {
          const image = mediaUrl(theme.images[0]);
          const keywords = localized(theme, "keywords", lang).join(", ");
          return (
            <li key={theme.id}>
              {/* 화면에 들어오면 글 · 이미지가 떠오름 */}
              <InView y={40}>
                <SiteNextLink
                  href={localePath(lang, `/research/${theme.slug}`)}
                  cursorLabel="Open"
                  className={classNames(
                    // Figma: 번호 280 · 글 560 · 이미지 520 (1360 폭 기준 비율)
                    "group grid gap-y-6 lg:grid-cols-[minmax(0,280fr)_minmax(0,560fr)_minmax(0,520fr)] lg:gap-x-0",
                  )}
                >
                  {/* 첫 칸: 번호를 뺀 빈 자리 (넓은 화면의 3단 비율은 그대로 둠) */}
                  <span aria-hidden className={classNames("hidden lg:block")} />

                  {/* 분야 이름 → 질문 → 요약, 자세히 보기는 이미지 아래 끝에 맞춰 맨 아래 */}
                  <span className={classNames("flex flex-col gap-8 lg:pr-10")}>
                    <span className={classNames("flex flex-col gap-2")}>
                      <span
                        className={classNames(
                          "text-base font-medium break-keep",
                        )}
                      >
                        {localized(theme, "title", lang)}
                      </span>
                      <span
                        className={classNames(
                          "text-2xl leading-[1.4] whitespace-pre-line break-keep md:text-3xl",
                        )}
                      >
                        {localized(theme, "question", lang) ||
                          localized(theme, "title", lang)}
                      </span>
                      {localized(theme, "summary", lang) ? (
                        <span
                          className={classNames(
                            "mt-5 max-w-md",
                            "text-sm leading-normal break-keep text-gray-500",
                          )}
                        >
                          {localized(theme, "summary", lang)}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={classNames(
                        "mt-auto inline-flex items-center gap-1.5",
                        "text-sm text-[#7e7e7e]",
                      )}
                    >
                      {dict.research.more}
                      <span
                        aria-hidden
                        className={classNames(
                          "transition-transform duration-300 group-hover:translate-x-1",
                        )}
                      >
                        →
                      </span>
                    </span>
                  </span>

                  {/* 대표 이미지 (520:277) + 아래에서 위로 분야 색 그라데이션 · 세부 분야 · 영문 제목 */}
                  <span
                    className={classNames(
                      "aspect-[520/277] w-full",
                      "relative block overflow-hidden",
                      "rounded-2xl bg-sheet",
                      "[&_img]:transition-transform [&_img]:duration-700 [&_img]:ease-[cubic-bezier(.22,1,.36,1)] group-hover:[&_img]:scale-105",
                    )}
                  >
                    {image ? (
                      <CroppedImage
                        src={image}
                        alt={localized(theme, "image_alt", lang)}
                      />
                    ) : null}
                    <span
                      className={classNames(
                        "absolute inset-x-0 bottom-0 flex flex-col",
                        "px-5 pt-24 pb-4 md:px-7 md:pb-4",
                        "bg-linear-to-t to-transparent",
                        GRADIENT[theme.number] ?? "from-black/70",
                        "font-neuehaas font-light text-white",
                      )}
                    >
                      {keywords ? (
                        <span className={classNames("text-sm md:text-lg")}>
                          {keywords}
                        </span>
                      ) : null}
                      <span className={classNames("text-xl md:text-3xl")}>
                        {theme.title_en || localized(theme, "title", lang)}
                      </span>
                    </span>
                  </span>
                </SiteNextLink>
              </InView>
            </li>
          );
        })}
      </ol>
    </>
  );
}
