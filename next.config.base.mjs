// admin · client 가 함께 쓰는 Next.js 설정 (각 앱의 next.config.js 에서 import)
import { existsSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";

/**
 * 모노레포 루트의 .env 파일을 읽습니다. (env는 루트 .env.local 하나로 관리)
 * Next.js 와 같은 우선순위로 읽고, 이미 있는 값(셸/배포 환경변수)은 덮어쓰지 않습니다.
 */
const rootDir = fileURLToPath(new URL("./", import.meta.url));
// NODE_ENV 는 next dev/build 가 직접 설정하므로 turbo env 선언이 필요 없습니다.
const nodeEnv = process.env.NODE_ENV; // eslint-disable-line turbo/no-undeclared-env-vars
const mode = nodeEnv === "production" ? "production" : "development";
for (const file of [
  `.env.${mode}.local`,
  ".env.local",
  `.env.${mode}`,
  ".env",
]) {
  if (existsSync(rootDir + file)) process.loadEnvFile(rootDir + file);
}

/**
 * SVG를 React 컴포넌트로 import 합니다.
 *   import Logo from "@/public/img/logo.svg";
 *   <Logo className="h-6 w-auto" />
 * (Next 16의 기본 번들러인 Turbopack 기준 설정)
 */
const svgrRule = {
  loaders: [
    {
      loader: "@svgr/webpack",
      options: {
        typescript: true,
        ref: true,
        titleProp: true,
        svgoConfig: {
          plugins: [
            {
              name: "preset-default",
              params: { overrides: { removeViewBox: false } },
            },
          ],
        },
      },
    },
  ],
  as: "*.js",
};

/**
 * @param {{ frameOptions: "DENY" | "SAMEORIGIN" }} options
 *   frameOptions: 다른 사이트가 iframe 으로 넣는 것을 막는 수준 (admin 은 DENY)
 * @returns {import("next").NextConfig}
 */
export function createNextConfig({ frameOptions }) {
  return {
    reactStrictMode: true,
    poweredByHeader: false,
    async headers() {
      return [
        {
          source: "/:path*",
          headers: [
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "X-Frame-Options", value: frameOptions },
          ],
        },
      ];
    },
    // 브라우저/크롤러의 기본 요청(/favicon.ico)을 public/icons 로 연결합니다.
    async rewrites() {
      return [{ source: "/favicon.ico", destination: "/icons/favicon.ico" }];
    },
    turbopack: {
      rules: {
        "*.svg": svgrRule,
      },
    },
  };
}
