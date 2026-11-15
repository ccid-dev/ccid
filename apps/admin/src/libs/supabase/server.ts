import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { config } from "@/config";
import type { Database } from "@/types";

export function assertSupabaseEnv() {
  if (!config.supabase.url || !config.supabase.publishableKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 가 설정되지 않았습니다. 루트 .env.local 을 확인하세요.",
    );
  }
}

/**
 * 로그인한 사용자 권한으로 동작하는 클라이언트 (서버 컴포넌트 · 서버 액션).
 * 요청마다 새로 만듭니다. 읽기·쓰기 범위는 DB 의 RLS 정책이 정합니다.
 */
export async function createClient() {
  assertSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    config.supabase.url,
    config.supabase.publishableKey,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // 서버 컴포넌트에서는 쿠키를 쓸 수 없습니다. 세션 갱신은 proxy.ts 가 맡습니다.
          }
        },
      },
    },
  );
}
