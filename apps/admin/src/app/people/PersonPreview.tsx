"use client";

import classNames from "classnames";
import { PersonCard } from "@repo/blocks";
import {
  first,
  pickText,
  PreviewScene,
  SITE_TEXT,
  type FormValues,
  type PreviewLang,
} from "@/components/preview";
import { mediaUrl } from "@/libs/media";

/** 사이트 People 에서 보이는 카드 (넓은 화면의 실제 카드 너비) */
export function PersonPreview({
  values,
  lang,
}: {
  values: FormValues;
  lang: PreviewLang;
}) {
  const image = first(values, "image");
  return (
    <PreviewScene label="People 카드">
      <div className={classNames("w-full max-w-[200px]")}>
        <PersonCard
          profileLabel={SITE_TEXT[lang].profile}
          person={{
            name: pickText(values, "name", lang) || "이름 없음",
            role: pickText(values, "role", lang),
            bio: pickText(values, "bio", lang),
            profile: pickText(values, "profile", lang),
            image: mediaUrl(image),
            imageFallback: image || "사진 없음",
          }}
        />
      </div>
    </PreviewScene>
  );
}
