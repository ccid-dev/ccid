import classNames from "classnames";
import type { Metadata } from "next";
import Link from "next/link";
import { ThemeDot } from "@repo/common";
import {
  AdminPage,
  Badge,
  Eyebrow,
  LoadError,
  Panel,
  PublishBadge,
} from "@/components/ui";
import { ROUTES } from "@/constants";
import { requireAdmin } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import { NewProjectButton } from "./NewProjectButton";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, title_ko, title_en, client_ko, client_en, year_start, year_end, is_nda, is_published, project_themes(position, themes(number))",
    )
    .order("year_start", { ascending: false })
    .order("sort_order")
    .order("created_at");

  const projects = data ?? [];
  const publishedCount = projects.filter((p) => p.is_published).length;
  /** 표 칸 너비 (머리줄과 행이 같이 씀) */
  const columns =
    "grid gap-x-6 gap-y-1 md:grid-cols-[56px_1fr_200px_96px_auto] md:items-center";

  return (
    <AdminPage
      title="Projects"
      description={`${projects.length}개 · 공개 ${publishedCount}개`}
      actions={<NewProjectButton />}
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
            {["Year", "Title", "Client", "Research", "Status"].map((head) => (
              <Eyebrow key={head} muted>
                {head}
              </Eyebrow>
            ))}
          </div>
          <ul className={classNames("divide-y divide-white")}>
            {projects.map((project, index) => {
              const firstOfYear =
                projects[index - 1]?.year_start !== project.year_start;
              const themes = [...project.project_themes]
                .sort((a, b) => a.position - b.position)
                .map((link) => link.themes?.number)
                .filter((n): n is number => n != null);
              return (
                <li key={project.id}>
                  <Link
                    href={`${ROUTES.projects}/${project.id}`}
                    className={classNames(
                      columns,
                      "px-8 py-5",
                      "transition hover:bg-sheet",
                    )}
                  >
                    <span
                      className={classNames(
                        "font-neuehaas text-sm font-medium",
                        { "md:invisible": !firstOfYear },
                      )}
                    >
                      {project.year_start}
                      {project.year_end
                        ? `–${String(project.year_end).slice(2)}`
                        : ""}
                    </span>
                    <span className={classNames("min-w-0")}>
                      <span
                        className={classNames(
                          "block",
                          "truncate text-sm font-medium",
                        )}
                      >
                        {project.title_ko || project.title_en}
                      </span>
                      {project.title_ko && project.title_en ? (
                        <span
                          className={classNames(
                            "block",
                            "truncate font-neuehaas text-xs text-sub",
                          )}
                        >
                          {project.title_en}
                        </span>
                      ) : null}
                    </span>
                    <span className={classNames("truncate text-sm text-sub")}>
                      {project.client_ko || project.client_en}
                    </span>
                    <span
                      className={classNames(
                        "flex flex-wrap items-center gap-x-3 gap-y-1",
                        "font-neuehaas text-sm text-sub",
                      )}
                    >
                      {themes.length
                        ? themes.map((n) => (
                            <span
                              key={n}
                              className={classNames(
                                "inline-flex items-center gap-1.5",
                              )}
                            >
                              <ThemeDot number={n} size="sm" />
                              {String(n).padStart(2, "0")}
                            </span>
                          ))
                        : "—"}
                    </span>
                    <span className={classNames("flex gap-1.5")}>
                      {project.is_nda ? <Badge tone="strong">NDA</Badge> : null}
                      <PublishBadge published={project.is_published} />
                    </span>
                  </Link>
                </li>
              );
            })}
            {!projects.length ? (
              <li className={classNames("px-6 py-10", "text-sm text-sub")}>
                아직 프로젝트가 없습니다.
              </li>
            ) : null}
          </ul>
        </Panel>
      )}
    </AdminPage>
  );
}
