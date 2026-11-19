import classNames from "classnames";
import { ImageCarousel } from "./ImageCarousel";
import { MediaBox } from "./MediaBox";

/**
 * 리서치 머리 이미지. 장수에 따라 형태가 정해져 있어 많아져도 복잡해지지 않습니다.
 *   1장: 한 장 크게
 *   2장: 반반
 *   3장: 왼쪽 큰 대표 + 오른쪽 2장 (좁은 화면은 대표 아래 2장)
 *   4장 이상: 한 장씩 넘겨 보는 캐러셀 (이전 · 다음 · 번호)
 */
export function ImageBento({
  images,
  alt,
  label,
  prevLabel,
  nextLabel,
}: {
  images: string[];
  alt: string;
  label: string;
  prevLabel: string;
  nextLabel: string;
}) {
  if (!images.length) return null;

  if (images.length >= 4)
    return (
      <ImageCarousel
        images={images}
        alt={alt}
        label={label}
        prevLabel={prevLabel}
        nextLabel={nextLabel}
      />
    );

  if (images.length === 3) {
    const [main, ...side] = images;
    return (
      <ul
        aria-label={label}
        className={classNames("grid grid-cols-2 gap-3 md:grid-cols-3")}
      >
        <li className={classNames("col-span-2 md:row-span-2")}>
          <MediaBox src={main} alt={alt} />
        </li>
        {side.map((image) => (
          <li key={image}>
            <MediaBox src={image} alt={alt} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul
      aria-label={label}
      className={classNames(
        "grid gap-3",
        images.length === 2 ? "md:grid-cols-2" : "grid-cols-1",
      )}
    >
      {images.map((image) => (
        <li key={image}>
          <MediaBox
            src={image}
            alt={alt}
            ratio={images.length === 1 ? "banner" : "thumbnail"}
          />
        </li>
      ))}
    </ul>
  );
}
