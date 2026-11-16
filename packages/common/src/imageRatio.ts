/**
 * 이미지 비율. 값은 packages/styles/src/global.css 의 --aspect-* 에서 정합니다.
 *   thumbnail 4:3 (목록 · 분야 이미지) · banner 16:9 (넓은 대표 이미지) · profile 3:4 (구성원 사진)
 * 클래스로 바로 써도 되고(aspect-thumbnail), 컴포넌트 prop 으로 받을 때는 아래 이름을 씁니다.
 */
export const IMAGE_RATIOS = {
  thumbnail: "aspect-thumbnail",
  banner: "aspect-banner",
  profile: "aspect-profile",
} as const;

export type ImageRatio = keyof typeof IMAGE_RATIOS;

/** 비율 숫자 (가로 / 세로) — 이미지 크롭 도구에서 씁니다. global.css 의 값과 같게 둡니다. */
export const IMAGE_ASPECTS: Record<ImageRatio, number> = {
  thumbnail: 4 / 3,
  banner: 16 / 9,
  profile: 3 / 4,
};
