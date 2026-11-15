import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { config } from "@/config";
import type { Database } from "@/types";

/**
 * 요청마다 로그인 세션(쿠키)을 갱신하고, 로그인한 사용자 id 를 돌려줍니다.
 * 응답에는 갱신된 쿠키와 캐시 금지 헤더가 실립니다.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!config.supabase.url || !config.supabase.publishableKey) {
    return { response, userId: null };
  }

  const supabase = createServerClient<Database>(
    config.supabase.url,
    config.supabase.publishableKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  // createServerClient 와 getClaims 사이에 다른 코드를 넣지 마세요. (세션이 풀릴 수 있음)
  const { data } = await supabase.auth.getClaims();
  return { response, userId: data?.claims.sub ?? null };
}
