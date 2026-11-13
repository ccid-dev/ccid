import { config } from "@/config";

/**
 * R2 오브젝트 키 → 공개 URL.
 * 이미 절대 URL이거나 public 경로(`/img/...`)면 그대로 반환합니다.
 */
export function getR2PublicUrl(keyOrUrl: string) {
  if (/^(https?:)?\/\//.test(keyOrUrl) || keyOrUrl.startsWith("/")) {
    return keyOrUrl;
  }
  if (!config.r2.publicUrl) {
    throw new Error("NEXT_PUBLIC_R2_PUBLIC_URL이 설정되지 않았습니다.");
  }
  return `${config.r2.publicUrl}/${keyOrUrl.replace(/^\/+/, "")}`;
}
