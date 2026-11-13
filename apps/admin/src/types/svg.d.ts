// @svgr/webpack: `import Icon from "@/public/img/logo.svg"` → React 컴포넌트
declare module "*.svg" {
  import type { FC, SVGProps } from "react";

  const SvgComponent: FC<SVGProps<SVGSVGElement> & { title?: string }>;
  export default SvgComponent;
}
