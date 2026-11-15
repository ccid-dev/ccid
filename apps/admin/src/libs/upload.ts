import { config } from "@/config";
import { createBrowserSupabase } from "./supabase/client";

/**
 * 업로드 형식
 * - webp: 기본. 브라우저에서 WebP 로 바꾸고 긴 변을 MAX_EDGE 이하로 줄입니다. (투명 배경도 유지)
 * - png : 로고 · 스티커처럼 PNG 그대로 둬야 하는 이미지. 크기만 줄이고 PNG 로 올립니다.
 * - gif : 움직이는 이미지. 변환하면 움직임이 사라지므로 원본 그대로 올립니다.
 */
export type UploadFormat = "webp" | "png" | "gif";

export const UPLOAD_FORMATS: {
  value: UploadFormat;
  label: string;
  description: string;
  accept: string;
}[] = [
  {
    value: "webp",
    label: "WebP",
    description: "자동 최적화 (권장)",
    accept: "image/jpeg,image/png,image/webp,image/avif,image/gif",
  },
  {
    value: "png",
    label: "PNG",
    description: "투명 배경 · 로고 · 스티커",
    accept: "image/png",
  },
  {
    value: "gif",
    label: "GIF",
    description: "움직이는 이미지",
    accept: "image/gif",
  },
];

/** 긴 변 최대 길이 (px) */
const MAX_EDGE = 2400;
const WEBP_QUALITY = 0.82;
/** 변환 전 원본 최대 크기 / 저장소에 올라가는 최대 크기 (버킷 제한과 같음) */
const MAX_INPUT = 30 * 1024 * 1024;
const MAX_OUTPUT = 10 * 1024 * 1024;

type Optimized = { blob: Blob; type: string; ext: string };

export const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)}MB`
    : `${Math.max(1, Math.round(bytes / 1024))}KB`;

function fit(width: number, height: number) {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    resized: scale < 1,
  };
}

async function encode(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  type: string,
  quality?: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("이미지를 변환하지 못했습니다.");
  if (type === "image/jpeg") {
    // JPEG 는 투명을 지원하지 않으므로 흰 바탕을 깝니다.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("이미지를 변환하지 못했습니다.")),
      type,
      quality,
    ),
  );
}

/** 고른 형식에 맞게 이미지를 줄이고 바꿉니다. (브라우저에서 실행) */
export async function optimizeImage(
  file: File,
  format: UploadFormat,
): Promise<Optimized> {
  if (format === "gif") {
    if (file.type !== "image/gif")
      throw new Error("GIF 형식을 골랐다면 GIF 파일만 올릴 수 있습니다.");
    return { blob: file, type: "image/gif", ext: "gif" };
  }

  if (format === "png" && file.type !== "image/png")
    throw new Error("PNG 형식을 골랐다면 PNG 파일만 올릴 수 있습니다.");
  if (file.size > MAX_INPUT)
    throw new Error(
      `${formatBytes(MAX_INPUT)} 이하 이미지만 올릴 수 있습니다.`,
    );

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("이미지를 읽지 못했습니다. 다른 파일로 시도해 주세요.");
  });
  try {
    const { width, height, resized } = fit(bitmap.width, bitmap.height);

    if (format === "png") {
      if (!resized) return { blob: file, type: "image/png", ext: "png" };
      const blob = await encode(bitmap, width, height, "image/png");
      return { blob, type: "image/png", ext: "png" };
    }

    let blob = await encode(bitmap, width, height, "image/webp", WEBP_QUALITY);
    // WebP 저장을 지원하지 않는 브라우저(일부 Safari)는 PNG 를 돌려줍니다 → JPEG 로 대신 저장
    if (blob.type !== "image/webp")
      blob = await encode(bitmap, width, height, "image/jpeg", 0.85);
    // 이미 작은 WebP 였는데 다시 저장해서 커졌다면 원본을 씁니다.
    if (file.type === "image/webp" && !resized && blob.size >= file.size)
      return { blob: file, type: "image/webp", ext: "webp" };
    return {
      blob,
      type: blob.type,
      ext: blob.type === "image/webp" ? "webp" : "jpg",
    };
  } finally {
    bitmap.close();
  }
}

/**
 * 이미지를 최적화해서 media 버킷에 올리고 키를 돌려줍니다. (클라이언트 컴포넌트에서 호출)
 *   await uploadImage(file, "themes", "webp") → { key: "themes/3f2a….webp", … }
 * 승인된 계정만 올릴 수 있습니다. (Storage RLS)
 */
export async function uploadImage(
  file: File,
  folder: string,
  format: UploadFormat = "webp",
) {
  const { blob, type, ext } = await optimizeImage(file, format);
  if (blob.size > MAX_OUTPUT)
    throw new Error(
      `변환 후에도 ${formatBytes(MAX_OUTPUT)}를 넘습니다. (${formatBytes(blob.size)})`,
    );

  const key = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await createBrowserSupabase()
    .storage.from(config.media.bucket)
    .upload(key, blob, { contentType: type, cacheControl: "31536000" });
  if (error) throw new Error(`이미지를 올리지 못했습니다. (${error.message})`);
  return { key, originalSize: file.size, size: blob.size, ext };
}
