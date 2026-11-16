/**
 * 이미지 크롭 정보 — 원본은 그대로 두고, 이미지 키 끝에 보일 영역을 적어 둡니다.
 *   "img/2025/a.webp#crop=10,5,80,60"  → 원본의 (x 10%, y 5%) 에서 너비 80% · 높이 60% 영역
 * 화면에서는 이 영역이 상자에 꽉 차도록 원본을 키우고 옮겨서 보여 줍니다. (다시 크롭해도 화질 그대로)
 * 크롭 비율은 그 이미지를 보여 주는 상자 비율(4:3 · 3:4 …)과 같게 만듭니다.
 */
export type CropArea = { x: number; y: number; width: number; height: number };

const MARK = "#crop=";

/** "키#crop=…" → 키 · 크롭 (없으면 null) */
export function splitCrop(value: string): {
  key: string;
  crop: CropArea | null;
} {
  const index = value.indexOf(MARK);
  if (index < 0) return { key: value, crop: null };
  const [x, y, width, height] = value
    .slice(index + MARK.length)
    .split(",")
    .map(Number);
  const valid = [x, y, width, height].every(
    (n) => typeof n === "number" && Number.isFinite(n),
  );
  return {
    key: value.slice(0, index),
    crop:
      valid && width! > 0 && height! > 0
        ? { x: x!, y: y!, width: width!, height: height! }
        : null,
  };
}

/** 키 + 크롭 → 저장할 값 (크롭이 없으면 키만) */
export function withCrop(key: string, crop: CropArea | null) {
  const { key: base } = splitCrop(key);
  if (!crop) return base;
  const n = (v: number) => Math.round(v * 100) / 100;
  return `${base}${MARK}${[crop.x, crop.y, crop.width, crop.height].map(n).join(",")}`;
}

/** 크롭 영역이 상자에 꽉 차도록 원본 이미지를 놓는 위치 · 크기 (% 값) */
export function cropBox(crop: CropArea) {
  return {
    width: `${10000 / crop.width}%`,
    height: `${10000 / crop.height}%`,
    left: `${(-crop.x * 100) / crop.width}%`,
    top: `${(-crop.y * 100) / crop.height}%`,
  };
}
