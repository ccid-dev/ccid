import classNames from "classnames";
import type { Metadata } from "next";
import Link from "next/link";
import { ThemeDot } from "@repo/common";
import { AdminPage, LoadError, PublishBadge } from "@/components/ui";
import { ROUTES } from "@/constants";
import { requireAdmin } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import { NewThemeButton } from "./NewThemeButton";

export const metadata: Metadata = { title: "Research" };

export default async function ThemesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("themes")
    .select(
      "id, number, slug, title_ko, title_en, summary_ko, is_published, project_themes(count)",
    )
    .order("number");
  const themes = data ?? [];
  const nextNumber = Math.max(0, ...themes.map((t) => t.number)) + 1;

  return (
    <AdminPage
      title="Research"
      description="리서치 분야를 관리합니다. 프로젝트 연결은 각 프로젝트에서 고릅니다."
      actions={<NewThemeButton nextNumber={nextNumber} />}
    >
      {error ? (
        <LoadError message={error.message} />
      ) : (
        <ul className={classNames("grid gap-3 sm:grid-cols-2 xl:grid-cols-4")}>
          {themes.map((theme) => (
            <li key={theme.id}>
              <Link
                href={`${ROUTES.themes}/${theme.id}`}
                className={classNames(
                  "h-full min-h-80",
                  "flex flex-col",
                  "p-7",
                  "rounded-3xl bg-sheet/60 transition hover:bg-sheet",
                )}
              >
                <div className={classNames("flex items-start justify-between")}>
                  <span className={classNames("flex items-start gap-3")}>
                    <span
                      className={classNames(
                        "font-neuehaas text-5xl leading-none font-medium tracking-[-0.04em]",
                      )}
                    >
                      {String(theme.number).padStart(2, "0")}
                    </span>
                    <ThemeDot number={theme.number} size="lg" />
                  </span>
                  <PublishBadge published={theme.is_published} />
                </div>
                <div className={classNames("mt-10")}>
                  <p
                    className={classNames(
                      "text-lg font-semibold tracking-[-0.02em]",
                    )}
                  >
                    {theme.title_ko || theme.title_en}
                  </p>
                  {theme.title_en ? (
                    <p className={classNames("font-neuehaas text-sm text-sub")}>
                      {theme.title_en}
                    </p>
                  ) : null}
                </div>
                {theme.summary_ko ? (
                  <p
                    className={classNames(
                      "mt-3",
                      "line-clamp-3 text-sm leading-6 text-sub",
                    )}
                  >
                    {theme.summary_ko}
                  </p>
                ) : null}
                <dl
                  className={classNames(
                    "grid grid-cols-[auto_1fr] gap-x-4 gap-y-1",
                    "mt-auto pt-6",
                    "font-neuehaas text-xs",
                  )}
                >
                  <dt className={classNames("text-mute")}>Projects</dt>
                  <dd className={classNames("text-right")}>
                    {theme.project_themes[0]?.count ?? 0}
                  </dd>
                  <dt className={classNames("text-mute")}>URL</dt>
                  <dd className={classNames("truncate text-right")}>
                    /research/{theme.slug}
                  </dd>
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminPage>
  );
}
