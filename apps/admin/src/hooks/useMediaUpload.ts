import { useState } from "react";
import { API_ROUTES, MEDIA_UPLOAD } from "@/constants";
import type {
  ApiError,
  MediaUploadRequest,
  MediaUploadResponse,
} from "@/types";

/**
 * 파일을 R2 에 올리고 공개 URL 을 돌려줍니다. (클라이언트 컴포넌트용)
 * 1) POST /api/upload 로 presigned URL 발급  2) 그 URL 로 파일을 직접 PUT
 */
export function useMediaUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File): Promise<string | null> => {
    setError(null);
    if (!Object.hasOwn(MEDIA_UPLOAD.allowedTypes, file.type)) {
      setError("지원하지 않는 파일 형식입니다.");
      return null;
    }
    if (file.size > MEDIA_UPLOAD.maxBytes) {
      setError(
        `최대 ${MEDIA_UPLOAD.maxBytes / 1024 / 1024}MB 까지 올릴 수 있습니다.`,
      );
      return null;
    }

    setIsUploading(true);
    try {
      const body: MediaUploadRequest = {
        contentType: file.type,
        size: file.size,
      };
      const response = await fetch(API_ROUTES.upload, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json().catch(() => null)) as
        MediaUploadResponse | ApiError | null;
      if (!response.ok || !data || "error" in data) {
        throw new Error(
          data && "error" in data
            ? data.error
            : "업로드 URL 을 받지 못했습니다.",
        );
      }

      const put = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error(`R2 업로드에 실패했습니다. (${put.status})`);

      return data.publicUrl;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "업로드에 실패했습니다.",
      );
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading, error };
}
