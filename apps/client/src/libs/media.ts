import { config } from "@/config";

/**
 * 이미지 키 → 공개 주소.
 *   mediaUrl("themes/interfaces/a.webp") → "<config.media.baseUrl>/themes/interfaces/a.webp"
 * 이미 절대 주소(기존 Google Drive 사진 등)면 그대로 돌려줍니다. 키가 없으면 null.
 *
 * DB 에는 키만 저장하므로, 저장소를 옮길 때는 같은 키로 파일을 복사하고
 * NEXT_PUBLIC_MEDIA_URL 만 바꾸면 됩니다.
 */
export function mediaUrl(keyOrUrl: string | null | undefined) {
  if (!keyOrUrl) return null;
  if (/^(https?:)?\/\//.test(keyOrUrl)) return keyOrUrl;
  if (!config.media.baseUrl) return null;
  return `${config.media.baseUrl}/${keyOrUrl.replace(/^\/+/, "")}`;
}
