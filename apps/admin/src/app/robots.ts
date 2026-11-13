import type { MetadataRoute } from "next";

/** 관리자 사이트는 전체 크롤링을 막습니다. */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: "/" }] };
}
