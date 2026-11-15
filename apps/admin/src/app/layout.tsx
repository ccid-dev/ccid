import classNames from "classnames";
import type { Metadata, Viewport } from "next";
import { APP_INFO } from "@/config";
import { ADOBE_FONTS_URL } from "@repo/styles";
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
    <html
      lang={APP_INFO.lang}
      className={classNames(fontVariables)}
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
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  title: {
    default: APP_INFO.title,
    template: APP_INFO.titleTemplate,
  },
  description: APP_INFO.description,
  authors: APP_INFO.authors,
  creator: primaryAuthor?.name,
  publisher: primaryAuthor?.name,
  generator: primaryAuthor?.name,
  applicationName: APP_INFO.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_INFO.title,
  },
  category: "webapp",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  referrer: "origin-when-cross-origin",
  // 관리자 페이지는 검색엔진에 노출하지 않습니다.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  themeColor: colors.background,
  userScalable: false,
  viewportFit: "cover",
};
