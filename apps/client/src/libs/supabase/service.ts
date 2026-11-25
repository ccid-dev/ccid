import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "@/config";
import type { Database } from "@/types";

let client: SupabaseClient<Database> | null | undefined;

/**
 * secret key 클라이언트 (RLS 우회). 보이스 에이전트 서버(/api/talk)에서만 씁니다:
 * 문의 저장(inquiries) · 하루 사용량 세기(talk_usage_bump).
 * SUPABASE_SECRET_KEY 가 없으면 null — 문의는 메일 앱 링크로, 사용량은 서버 메모리로 대신합니다.
 */
export function getServiceSupabase() {
  if (client !== undefined) return client;
  const key = (process.env.SUPABASE_SECRET_KEY ?? "").trim();
  client =
    config.supabase.url && key
      ? createClient<Database>(config.supabase.url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;
  return client;
}
