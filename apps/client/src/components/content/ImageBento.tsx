import classNames from "classnames";
import { MediaBox } from "./MediaBox";

/**
 * 이미지 벤또. 모든 칸이 4:3 비율을 지키고, 대표 이미지는 작은 칸 2개 너비(2×2)입니다.
 * 작은 칸을 2줄로 나눠 세울수록 대표 비율이 줄어듭니다.
 *   3장 이하: 같은 크기로 한 줄
 *   4–5장: 대표 50% + 작은 칸 2열
 *   6–7장: 대표 40% + 작은 칸 3열
 *   8장 이상: 대표 33% + 작은 칸 4열 (9장까지), 나머지는 아래 작은 칸들 (화면 너비에 맞춰 줄바꿈)
 */
const MAX_SMALL = 8;
const GRID_BY_COLUMNS: Record<number, string> = {
  2: "md:grid-cols-4",
  3: "md:grid-cols-5",
  4: "md:grid-cols-6",
};

export function ImageBento({
  images,
  alt,
  label,
}: {
  images: string[];
  alt: string;
  label: string;
}) {
  if (!images.length) return null;

  if (images.length <= 3)
    return (
      <ul
        aria-label={label}
        className={classNames("grid grid-cols-2 gap-3 md:grid-cols-3")}
      >
        {images.map((image, index) => (
          <li
            key={image}
            className={classNames({
              "col-span-2 md:col-span-1": index === 0,
            })}
          >
            <MediaBox src={image} alt={alt} />
          </li>
        ))}
      </ul>
    );

  const [main, ...others] = images;
  const small = others.slice(0, MAX_SMALL);
  const rest = others.slice(MAX_SMALL);
  const columns = Math.ceil(small.length / 2);

  return (
    <div aria-label={label} className={classNames("flex flex-col gap-3")}>
      <ul
        className={classNames(
          "grid grid-cols-2 gap-3",
          GRID_BY_COLUMNS[columns],
        )}
      >
        <li className={classNames("col-span-2 md:row-span-2")}>
          <MediaBox src={main} alt={alt} />
        </li>
        {small.map((image) => (
          <li key={image}>
            <MediaBox src={image} alt={alt} />
          </li>
        ))}
      </ul>
      {rest.length ? (
        <ul
          className={classNames(
            "grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8",
          )}
        >
          {rest.map((image) => (
            <li key={image} className={classNames("min-w-0")}>
              <MediaBox src={image} alt={alt} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
