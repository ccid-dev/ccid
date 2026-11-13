import { createNextConfig } from "../../next.config.base.mjs";

// 공통 설정(루트 env 로드, svgr, R2 이미지, 보안 헤더)은 루트 next.config.base.mjs 에 있습니다.
export default createNextConfig({ frameOptions: "DENY" });
