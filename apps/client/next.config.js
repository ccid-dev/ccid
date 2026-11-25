import os from "node:os";
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

// 개발 서버: 같은 Wi-Fi 의 폰 · 다른 기기에서 http://<이 맥의 IP>:3000 으로 열어 코멘트를 남길 수 있게
// 이 맥의 사설 IP(192.168 · 10 · 172.16–31)를 허용합니다. (기본은 localhost 만 허용 — 다른 주소는 개발용 스크립트가 막힘)
if (nodeEnv === "development") {
  const isPrivate = (ip) =>
    /^(192\.168|10)\./.test(ip) || /^172\.(1[6-9]|2\d|3[01])\./.test(ip);
  nextConfig.allowedDevOrigins = Object.values(os.networkInterfaces())
    .flat()
    .filter((net) => net && net.family === "IPv4" && isPrivate(net.address))
    .map((net) => net.address);
}

export default nextConfig;
