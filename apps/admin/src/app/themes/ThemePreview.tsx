"use client";

import { ResearchCard } from "@repo/blocks";
import {
  first,
  pickList,
  pickText,
  PreviewLink,
  PreviewScene,
  SITE_TEXT,
  type FormValues,
  type PreviewLang,
} from "@/components/preview";
import { mediaUrl } from "@/libs/media";

/** 사이트 Research 목록에서 보이는 모습: 글 · 대표 이미지 */
export function ThemePreview({
  values,
  lang,
}: {
  values: FormValues;
  lang: PreviewLang;
}) {
  return (
    <PreviewScene label="Research 목록">
      <ResearchCard
        Link={PreviewLink}
        moreLabel={SITE_TEXT[lang].more}
        theme={{
          title: pickText(values, "title", lang) || "제목 없음",
          subtitle: lang === "ko" ? first(values, "title_en") : "",
          question: pickText(values, "question", lang),
          summary: pickText(values, "summary", lang),
          keywords: pickList(values, "keywords", lang),
          image: mediaUrl(values.images?.[0]),
          imageAlt: pickText(values, "image_alt", lang),
          href: `/research/${first(values, "slug")}`,
        }}
      />
    </PreviewScene>
  );
}
