import type { Metadata, Viewport } from "next";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { APP_INFO } from "@/config";
import { colors, fontVariables } from "@/theme";
import "@/styles/global.css";
import { Layout } from "@/components";

const primaryAuthor = APP_INFO.authors[0];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={APP_INFO.lang} suppressHydrationWarning>
      <body className={fontVariables}>
        <Layout>{children}</Layout>
      </body>
      {/* ID가 없으면 빈 id로 스크립트를 요청해 400이 나므로, 환경변수가 있을 때만 붙인다 */}
      {process.env.NEXT_PUBLIC_GTM_ID ? (
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
      ) : null}
      {process.env.NEXT_PUBLIC_GA_ID ? (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      ) : null}
    </html>
  );
}

export const metadata: Metadata = {
  title: {
    default: APP_INFO.title,
    template: APP_INFO.titleTemplate,
  },
  description: APP_INFO.description,
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
  openGraph: {
    type: "website",
    siteName: APP_INFO.name,
    title: APP_INFO.title,
    description: APP_INFO.description,
    locale: APP_INFO.locale,
    url: APP_INFO.url ? new URL(APP_INFO.url) : undefined,
    images: {
      url: APP_INFO.ogImage,
    },
  },
  twitter: {
    card: "summary_large_image",
    title: APP_INFO.title,
    description: APP_INFO.description,
    creator: APP_INFO.twitterCreator,
    images: [APP_INFO.ogImage],
  },
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
      color: colors.ink,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  themeColor: colors.canvas,
  userScalable: false,
  viewportFit: "cover",
};
