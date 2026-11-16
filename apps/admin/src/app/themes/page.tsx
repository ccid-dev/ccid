import classNames from "classnames";
import type { Metadata } from "next";
import Link from "next/link";
import { ThemeDot } from "@repo/common";
import {
  AdminPage,
  Eyebrow,
  LoadError,
  Panel,
  PublishBadge,
} from "@/components/ui";
import { ROUTES } from "@/constants";
import { requireAdmin } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import { NewThemeButton } from "./NewThemeButton";

export const metadata: Metadata = { title: "Research" };

/** 리서치 분야 목록 (Projects 와 같은 표 모양) */
export default async function ThemesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("themes")
    .select(
      "id, number, slug, title_ko, title_en, images, is_published, project_themes(count)",
    )
    .order("number");
  const themes = data ?? [];
  const nextNumber = Math.max(0, ...themes.map((t) => t.number)) + 1;
  const publishedCount = themes.filter((t) => t.is_published).length;
  /** 표 칸 너비 (머리줄과 행이 같이 씀) */
  const columns =
    "grid gap-x-6 gap-y-1 md:grid-cols-[64px_minmax(0,1fr)_minmax(0,220px)_80px_72px_auto] md:items-center";

  return (
    <AdminPage
      title="Research"
      description={`${themes.length}개 · 공개 ${publishedCount}개 · 프로젝트 연결은 각 프로젝트에서 고릅니다.`}
      actions={<NewThemeButton nextNumber={nextNumber} />}
    >
      {error ? (
        <LoadError message={error.message} />
      ) : (
        <Panel className={classNames("overflow-hidden")}>
          <div
            className={classNames(
              ["hidden md:grid", columns],
              "px-8 pt-5 pb-3",
            )}
          >
            {["No.", "Title", "URL", "Projects", "Images", "Status"].map(
              (head) => (
                <Eyebrow key={head} muted>
                  {head}
                </Eyebrow>
              ),
            )}
          </div>
          <ul className={classNames("divide-y divide-white")}>
            {themes.map((theme) => (
              <li key={theme.id}>
                <Link
                  href={`${ROUTES.themes}/${theme.id}`}
                  className={classNames(
                    columns,
                    "px-8 py-4",
                    "transition hover:bg-sheet",
                  )}
                >
                  <span
                    className={classNames(
                      "flex items-center gap-2",
                      "font-neuehaas text-sm font-medium",
                    )}
                  >
                    <ThemeDot number={theme.number} size="sm" />
                    {String(theme.number).padStart(2, "0")}
                  </span>
                  <span className={classNames("min-w-0")}>
                    <span
                      className={classNames(
                        "block",
                        "truncate text-sm font-medium",
                      )}
                    >
                      {theme.title_ko || theme.title_en}
                    </span>
                    {theme.title_ko && theme.title_en ? (
                      <span
                        className={classNames(
                          "block",
                          "truncate font-neuehaas text-xs text-sub",
                        )}
                      >
                        {theme.title_en}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={classNames(
                      "truncate font-neuehaas text-sm text-sub",
                    )}
                  >
                    /research/{theme.slug}
                  </span>
                  <span
                    className={classNames("font-neuehaas text-sm text-sub")}
                  >
                    {theme.project_themes[0]?.count ?? 0}
                  </span>
                  <span
                    className={classNames("font-neuehaas text-sm text-sub")}
                  >
                    {theme.images.length}
                  </span>
                  <span className={classNames("flex gap-1.5")}>
                    <PublishBadge published={theme.is_published} />
                  </span>
                </Link>
              </li>
            ))}
            {!themes.length ? (
              <li className={classNames("px-8 py-10", "text-sm text-sub")}>
                아직 리서치 분야가 없습니다.
              </li>
            ) : null}
          </ul>
        </Panel>
      )}
    </AdminPage>
  );
}
