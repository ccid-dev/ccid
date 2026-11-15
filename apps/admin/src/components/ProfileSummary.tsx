import classNames from "classnames";
import type { ReactNode } from "react";
import { mediaUrl } from "@/libs/media";
import {
  PERSON_CATEGORY_LABEL,
  type Person,
  type PersonCategory,
} from "@/types";
import { PublishBadge } from "./ui";

/** 프로필 한 줄 요약: 사진 · 이름 · 그룹 · 직함 · 공개 상태 (+ 오른쪽 버튼) */
export function ProfileSummary({
  person,
  actions,
}: {
  person: Pick<
    Person,
    | "name_ko"
    | "name_en"
    | "role_ko"
    | "role_en"
    | "category"
    | "image"
    | "is_published"
  >;
  actions?: ReactNode;
}) {
  const image = mediaUrl(person.image);
  return (
    <div className={classNames("flex flex-wrap items-center gap-5")}>
      <span
        className={classNames(
          "aspect-profile w-16 shrink-0",
          "relative overflow-hidden",
          "rounded-lg bg-white",
        )}
      >
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            decoding="async"
            className={classNames("size-full", "absolute inset-0 object-cover")}
          />
        ) : null}
      </span>
      <div className={classNames("min-w-0 flex-1", "flex flex-col gap-1")}>
        <p className={classNames("font-neuehaas text-xl font-medium")}>
          {person.name_ko || person.name_en}
          {person.name_ko && person.name_en ? (
            <span className={classNames("ml-2", "text-sm text-sub")}>
              {person.name_en}
            </span>
          ) : null}
        </p>
        <p className={classNames("line-clamp-1 text-sm text-sub")}>
          {PERSON_CATEGORY_LABEL[person.category as PersonCategory]}
          {person.role_ko || person.role_en
            ? ` · ${person.role_ko || person.role_en}`
            : ""}
        </p>
        <div className={classNames("mt-1")}>
          <PublishBadge published={person.is_published} />
        </div>
      </div>
      {actions ? (
        <div className={classNames("flex gap-2")}>{actions}</div>
      ) : null}
    </div>
  );
}
