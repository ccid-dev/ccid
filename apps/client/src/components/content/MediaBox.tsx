import { SiteImage } from "@repo/blocks";
import type { ImageRatio } from "@repo/common";
import { mediaUrl } from "@/libs/media";

/**
 * 이미지 자리 (회색 면 · 둥근 모서리). 이미지 키를 공개 주소로 바꿔 공용 SiteImage 로 그립니다.
 * 주소가 없으면 회색 상자에 키를 적어 둡니다.
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
  return (
    <SiteImage
      src={mediaUrl(src)}
      alt={alt}
      ratio={ratio}
      fallback={src || "no image"}
    />
  );
}
