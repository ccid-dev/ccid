import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { MEDIA_UPLOAD } from "@/constants";
import { createR2UploadUrl, getR2PublicUrl } from "@/libs/r2";
import type {
  ApiError,
  MediaUploadRequest,
  MediaUploadResponse,
} from "@/types";

type AllowedType = keyof typeof MEDIA_UPLOAD.allowedTypes;

const isAllowedType = (value: unknown): value is AllowedType =>
  typeof value === "string" && Object.hasOwn(MEDIA_UPLOAD.allowedTypes, value);

const error = (message: string, status: number) =>
  NextResponse.json<ApiError>({ error: message }, { status });

/**
 * POST /api/upload  { contentType, size }
 * → R2 presigned PUT URL 발급. 브라우저는 uploadUrl 로 파일을 직접 PUT 합니다.
 *   (버킷 CORS 에 admin 도메인의 PUT 허용 필요)
 *
 * 주의: 인증이 없어 누구나 업로드 URL 을 받을 수 있습니다. 공개 배포 전에는 접근을 막으세요.
 */
export async function POST(request: Request) {
  const body = (await request
    .json()
    .catch(() => null)) as Partial<MediaUploadRequest> | null;

  if (!isAllowedType(body?.contentType)) {
    return error("지원하지 않는 파일 형식입니다.", 400);
  }
  if (
    typeof body.size !== "number" ||
    !Number.isInteger(body.size) ||
    body.size <= 0 ||
    body.size > MEDIA_UPLOAD.maxBytes
  ) {
    return error(
      `파일 용량이 올바르지 않습니다. (최대 ${MEDIA_UPLOAD.maxBytes / 1024 / 1024}MB)`,
      400,
    );
  }

  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const extension = MEDIA_UPLOAD.allowedTypes[body.contentType];
  const key = `media/${now.getUTCFullYear()}/${month}/${randomUUID()}.${extension}`;

  try {
    const uploadUrl = await createR2UploadUrl({
      key,
      contentType: body.contentType,
      contentLength: body.size,
      expiresIn: MEDIA_UPLOAD.expiresIn,
    });
    return NextResponse.json<MediaUploadResponse>({
      key,
      uploadUrl,
      publicUrl: getR2PublicUrl(key),
    });
  } catch (cause) {
    console.error("[api/upload]", cause);
    return error("업로드 URL 을 만들지 못했습니다. R2 설정을 확인하세요.", 500);
  }
}
