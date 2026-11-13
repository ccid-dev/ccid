import process from "node:process";
import { createNextConfig } from "../../next.config.base.mjs";

// 공통 설정(루트 env 로드, svgr, R2 이미지, 보안 헤더)은 루트 next.config.base.mjs 에 있습니다.
const nextConfig = createNextConfig({ frameOptions: "SAMEORIGIN" });

// canonical · sitemap · OG 가 localhost 를 가리키지 않도록 배포 빌드에서 알려줍니다.
const nodeEnv = process.env.NODE_ENV; // eslint-disable-line turbo/no-undeclared-env-vars
if (nodeEnv === "production" && !process.env.NEXT_PUBLIC_SITE_URL) {
  console.warn(
    "\n⚠ NEXT_PUBLIC_SITE_URL 이 비어 있어 canonical/sitemap/OG 가 http://localhost:3000 기준으로 생성됩니다.\n",
  );
}

export default nextConfig;
