import type { ContentDocument } from "@/types";

export const ROUTES = {
  home: "/",
} as const;

/** app/api 경로 */
export const API_ROUTES = {
  upload: "/api/upload",
} as const;

/** R2 업로드 허용 형식/용량 (app/api/upload) */
export const MEDIA_UPLOAD = {
  // SVG 는 스크립트를 담을 수 있어 기본으로 막아둡니다.
  allowedTypes: {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/gif": "gif",
  },
  maxBytes: 10 * 1024 * 1024,
  /** presigned URL 유효 시간(초) */
  expiresIn: 60,
} as const;

/** 블록 편집기 시작 문서 */
export const SAMPLE_DOCUMENT: ContentDocument = {
  version: 1,
  blocks: [
    { id: "title-sample", type: "title", content: { text: "블록 편집기" } },
    {
      id: "paragraph-sample",
      type: "paragraph",
      content: {
        text: "왼쪽에서 블록을 추가·수정하면 오른쪽에 client 와 같은 렌더러로 미리보기가 표시됩니다.",
      },
    },
  ],
};
