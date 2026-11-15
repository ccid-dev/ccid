import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { ROUTES } from "@/constants";
import { createClient } from "@/libs/supabase/server";

/**
 * 비밀번호 재설정 링크(Lab Members 에서 메인테이너가 만든 링크)를 확인합니다.
 * 확인되면 로그인 세션을 만들고 next(새 비밀번호 화면)로 보냅니다.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? ROUTES.home;
  // 다른 사이트로 보내지 않도록 같은 사이트 경로만 허용
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(new URL(safeNext, request.url));
  }

  const url = new URL(ROUTES.login, request.url);
  url.searchParams.set("error", "link");
  return NextResponse.redirect(url);
}
