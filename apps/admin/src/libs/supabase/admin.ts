import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "@/config";
import { serverConfig } from "@/config/server";
import type { Database } from "@/types";

let client: SupabaseClient<Database> | undefined;

/** secret key(service_role) 클라이언트 — RLS를 우회하므로 서버에서만 사용합니다. */
export function getSupabaseAdmin() {
  if (!config.supabase.url || !serverConfig.supabase.secretKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY 가 설정되지 않았습니다. 루트 .env.local 을 확인하세요.",
    );
  }
  client ??= createClient<Database>(
    config.supabase.url,
    serverConfig.supabase.secretKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return client;
}
