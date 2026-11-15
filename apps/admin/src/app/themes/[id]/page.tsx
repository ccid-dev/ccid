import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import { ThemeForm, type LinkedProject } from "../ThemeForm";

export const metadata: Metadata = { title: "분야 편집" };

export default async function EditThemePage({
  params,
}: PageProps<"/themes/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: theme }, { data: links }] = await Promise.all([
    supabase.from("themes").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("project_themes")
      .select(
        "position, projects(id, title_ko, title_en, year_start, is_published)",
      )
      .eq("theme_id", id),
  ]);
  if (!theme) notFound();

  const projects: LinkedProject[] = (links ?? [])
    .flatMap((link) =>
      link.projects
        ? [
            {
              id: link.projects.id,
              title: link.projects.title_ko || link.projects.title_en,
              year: link.projects.year_start,
              primary: link.position === 0,
              published: link.projects.is_published,
            },
          ]
        : [],
    )
    .sort((a, b) => b.year - a.year);

  return <ThemeForm key={theme.updated_at} theme={theme} projects={projects} />;
}
