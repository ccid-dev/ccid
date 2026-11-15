import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import { ProjectForm } from "../ProjectForm";
import { getThemeOptions } from "../data";

export const metadata: Metadata = { title: "프로젝트 편집" };

export default async function EditProjectPage({
  params,
}: PageProps<"/projects/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: project }, { data: links }, themes] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("project_themes")
      .select("theme_id, position")
      .eq("project_id", id)
      .order("position"),
    getThemeOptions(),
  ]);
  if (!project) notFound();

  return (
    <ProjectForm
      key={project.updated_at}
      project={project}
      themes={themes}
      linkedThemeIds={(links ?? []).map((link) => link.theme_id)}
    />
  );
}
