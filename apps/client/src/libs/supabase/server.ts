import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "@/config";
import type { Database } from "@/types";

let client: SupabaseClient<Database> | undefined;

/**
 * 서버 컴포넌트/Route Handler용 공개 클라이언트.
 * publishable key 로 동작해 RLS 정책이 허용한 데이터만 읽고, 쿠키를 쓰지 않아 정적 렌더링 · 캐싱에 영향이 없습니다.
 */
export function getSupabase() {
  if (!config.supabase.url || !config.supabase.publishableKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 가 설정되지 않았습니다. 루트 .env.local 을 확인하세요.",
    );
  }
  client ??= createClient<Database>(
    config.supabase.url,
    config.supabase.publishableKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return client;
}
