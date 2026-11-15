import type { MetadataRoute } from "next";
import { ROUTES } from "@/constants";
import { localePath, locales } from "@/i18n";
import { getThemes } from "@/libs/content";
import { absoluteUrl } from "@/libs/seo";

export const revalidate = 3600;

/** 언어 없는 경로 목록 → 언어별 주소(/people, /en/people)와 hreflang */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const themes = await getThemes();
  const paths: { path: string; priority: number }[] = [
    { path: ROUTES.home, priority: 1 },
    { path: ROUTES.research, priority: 0.9 },
    { path: ROUTES.projects, priority: 0.9 },
    ...themes.map((theme) => ({
      path: `/research/${theme.slug}`,
      priority: 0.8,
    })),
    { path: ROUTES.people, priority: 0.6 },
  ];

  return paths.flatMap(({ path, priority }) =>
    locales.map((locale) => ({
      url: absoluteUrl(localePath(locale, path)),
      changeFrequency: "weekly" as const,
      priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, absoluteUrl(localePath(l, path))]),
        ),
      },
    })),
  );
}
