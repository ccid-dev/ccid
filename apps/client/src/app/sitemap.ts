import type { MetadataRoute } from "next";
import { ROUTES } from "@/constants";
import { absoluteUrl } from "@/libs/seo";

/** 페이지가 추가되면 여기에 경로를 더합니다. (DB 콘텐츠는 조회해서 map) */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl(ROUTES.home),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
