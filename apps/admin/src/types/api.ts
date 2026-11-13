/** app/api 요청 · 응답 타입 (Route Handler 와 클라이언트 코드가 함께 사용) */

export type ApiError = { error: string };

/** POST /api/upload */
export type MediaUploadRequest = { contentType: string; size: number };
export type MediaUploadResponse = {
  key: string;
  uploadUrl: string;
  publicUrl: string;
};
