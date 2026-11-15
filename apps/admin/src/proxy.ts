import { NextResponse, type NextRequest } from "next/server";
import { ROUTES } from "@/constants";
import { updateSession } from "@/libs/supabase/proxy";

/** 로그인 없이 볼 수 있는 페이지 (로그인했으면 홈으로 보냄) */
const PUBLIC_PATHS: string[] = [ROUTES.login, ROUTES.signup];
/** 로그인 여부와 상관없이 지나가는 경로 (비밀번호 재설정 링크 확인) */
const OPEN_PATHS: string[] = [ROUTES.authConfirm];

/**
 * - 로그인 세션을 갱신합니다.
 * - 로그인하지 않았으면 로그인 페이지로 보냅니다.
 * - 승인 여부(대기 · 거절)는 각 페이지의 requireAdmin() 이 확인합니다.
 */
export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const { pathname } = request.nextUrl;
  if (OPEN_PATHS.includes(pathname)) return response;
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!userId && !isPublic) {
    return redirectWithCookies(request, response, ROUTES.login);
  }
  if (userId && isPublic) {
    return redirectWithCookies(request, response, ROUTES.home);
  }
  return response;
}

/** 갱신된 세션 쿠키를 잃지 않도록 옮겨 담아 이동합니다. */
function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  response.headers.forEach((value, key) => {
    if (key !== "location" && key !== "set-cookie")
      redirect.headers.set(key, value);
  });
  return redirect;
}

export const config = {
  // _next, 확장자가 있는 파일(아이콘 · 폰트 · robots.txt · manifest.json 등)은 제외
  matcher: ["/((?!_next|.*\\..*).*)"],
};
