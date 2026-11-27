import classNames from "classnames";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { APP_INFO, config } from "@/config";
import { ADOBE_FONTS_URL } from "@repo/styles";
import { colors, fontVariables } from "@/theme";
import "@/styles/global.css";
import { Layout } from "@/components";
import { hasLocale, locales } from "@/i18n";
import { getDictionary } from "@/i18n/server";
import { shareMetadata } from "@/libs/seo";

const primaryAuthor = APP_INFO.authors[0];

/** ko, en 두 언어를 빌드 시 미리 만듭니다. (한국어 주소에는 /ko 가 보이지 않습니다. proxy.ts 참고) */
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <html
      lang={lang}
      className={classNames(
        fontVariables,
        // 페이지 끝(푸터)에서 고무줄처럼 더 끌려가며 흰 바탕이 보이지 않게 — 푸터 배경으로 딱 끝남
        "overscroll-y-none",
        // 창이 열려 있으면 뒤 페이지 스크롤을 막음: 약력 창(PersonCard popover, data-scroll-lock) · 모달 <dialog>(Join 안내 등)
        "has-[[data-scroll-lock]:popover-open]:overflow-hidden has-[dialog:modal]:overflow-hidden",
      )}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="preconnect"
          href="https://use.typekit.net"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href={ADOBE_FONTS_URL} />
      </head>
      {/* 브라우저 확장 프로그램이 <body> 에 속성(예: location)을 붙여도 경고하지 않도록. (안쪽 내용은 그대로 검사) */}
      <body suppressHydrationWarning>
        <Layout>{children}</Layout>
      </body>
      {/* 방문 통계: 운영 배포에서만 (config.analytics). ID 가 없으면 빈 id 로 스크립트를 요청해 400 이 나므로 있을 때만 */}
      {config.analytics.gtmId ? (
        <GoogleTagManager gtmId={config.analytics.gtmId} />
      ) : null}
      {config.analytics.gaId ? (
        <GoogleAnalytics gaId={config.analytics.gaId} />
      ) : null}
    </html>
  );
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return {
    title: {
      default: APP_INFO.title,
      template: APP_INFO.titleTemplate,
    },
    description: dict.meta.description,
    keywords: APP_INFO.keywords,
    authors: APP_INFO.authors,
    creator: primaryAuthor?.name,
    publisher: primaryAuthor?.name,
    generator: primaryAuthor?.name,
    applicationName: APP_INFO.name,
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: APP_INFO.title,
      // startUpImage: [],
    },
    metadataBase: APP_INFO.url ? new URL(APP_INFO.url) : undefined,
    category: "webapp",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    // 공유 미리보기 기본값 (홈) — 하위 페이지는 pageMetadata 로 제목 · 설명 · 주소를 바꿈
    ...shareMetadata(lang, { description: dict.meta.description }),
    verification: {
      google: APP_INFO.google_site_verification,
      other: APP_INFO.naver_site_verification
        ? { "naver-site-verification": APP_INFO.naver_site_verification }
        : undefined,
    },
    referrer: "origin-when-cross-origin",
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      shortcut: "/icons/favicon.ico",
      icon: [
        { url: "/icons/apple-touch-icon.png" },
        { url: "/icons/favicon-16x16.png", sizes: "16x16" },
        { url: "/icons/favicon-32x32.png", sizes: "32x32" },
        { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
        { url: "/icons/android-icon-192x192.png", sizes: "192x192" },
        { url: "/icons/android-icon-512x512.png", sizes: "512x512" },
      ],
      apple: [
        { url: "/icons/apple-touch-icon.png" },
        { url: "/icons/favicon-16x16.png", sizes: "16x16" },
        { url: "/icons/favicon-32x32.png", sizes: "32x32" },
        { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
      ],
      other: {
        rel: "mask-icon",
        url: "/icons/safari-pinned-tab.svg",
        color: colors.textMain,
      },
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  themeColor: colors.background,
  userScalable: false,
  viewportFit: "cover",
};
