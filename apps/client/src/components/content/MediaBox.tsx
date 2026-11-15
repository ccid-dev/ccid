import classNames from "classnames";
import { IMAGE_RATIOS, type ImageRatio } from "@repo/common";
import { mediaUrl } from "@/libs/media";

/**
 * 이미지 자리 (회색 면 · 둥근 모서리). 이미지 주소가 있으면 보여주고,
 * 없으면 회색 상자에 키를 적어 둡니다.
 * 이미지는 admin 업로드 때 이미 최적화(WebP · 크기 축소)되므로 일반 <img> 를 씁니다.
 */
export function MediaBox({
  src,
  alt,
  ratio = "thumbnail",
}: {
  src: string | null | undefined;
  alt: string;
  /** 이미지 비율: thumbnail(4:3) · banner(16:9) · profile(3:4) */
  ratio?: ImageRatio;
}) {
  const url = mediaUrl(src);
  return (
    <div
      className={classNames(
        ["w-full", IMAGE_RATIOS[ratio]],
        "relative overflow-hidden",
        "rounded-2xl bg-sheet",
      )}
    >
      {url ? (
        <img
          src={url}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={classNames("size-full", "absolute inset-0 object-cover")}
        />
      ) : (
        <span
          className={classNames(
            "absolute inset-0 flex items-center justify-center",
            "p-3",
            "text-center text-xs break-all text-sub",
          )}
        >
          {src || "no image"}
        </span>
      )}
    </div>
  );
}
