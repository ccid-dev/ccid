import "server-only";

import { createClient } from "@supabase/supabase-js";
import { config } from "@/config";
import { serverConfig } from "@/config/server";
import type { Database } from "@/types";

/**
 * secret key 클라이언트: RLS 를 우회하고 Auth 관리 API(auth.admin)를 씁니다.
 * 메인테이너 확인(requireMaster)을 거친 서버 액션에서만 호출하세요.
 */
export function createAdminClient() {
  if (!config.supabase.url || !serverConfig.supabase.secretKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY 가 설정되지 않았습니다. 루트 .env.local 을 확인하세요.",
    );
  }
  return createClient<Database>(
    config.supabase.url,
    serverConfig.supabase.secretKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
