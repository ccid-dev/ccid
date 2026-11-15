import { createBrowserClient } from "@supabase/ssr";
import { config } from "@/config";
import type { Database } from "@/types";

/**
 * 브라우저(클라이언트 컴포넌트)용 클라이언트. 로그인 쿠키를 그대로 써서
 * 로그인한 계정 권한으로 동작합니다. (이미지 업로드 등)
 */
export function createBrowserSupabase() {
  return createBrowserClient<Database>(
    config.supabase.url,
    config.supabase.publishableKey,
  );
}
