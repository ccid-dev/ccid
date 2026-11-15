import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale } from "@/i18n/config";

/**
 * 한국어는 주소에 언어를 붙이지 않고, 영어만 /en 을 붙입니다.
 * 페이지 파일은 모두 app/[lang]/ 아래에 있으므로, 한국어 주소는 안에서만 /ko 로 바꿔 보여줍니다.
 *   /people     → (화면은 /ko/people, 주소창은 그대로 /people)
 *   /en/people  → 그대로
 *   /ko/people  → /people 로 이동 (같은 페이지가 두 주소로 나뉘지 않게)
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1] ?? "";

  if (first === defaultLocale) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(defaultLocale.length + 1) || "/";
    return NextResponse.redirect(url, 308);
  }

  if (hasLocale(first)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // _next, api, 확장자가 있는 파일(robots.txt, sitemap.xml, 이미지·폰트 등)은 제외
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
