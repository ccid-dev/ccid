"use client";

import classNames from "classnames";
import { useState } from "react";
import { ThemeDot } from "@repo/common";
import {
  EditorForm,
  EditorSection,
  InspectorSection,
  useEditorActions,
} from "@/components/editor";
import { BilingualField, Field, Switch } from "@/components/forms";
import { Badge, PublishBadge } from "@/components/ui";
import { ROUTES } from "@/constants";
import type { Project, Theme } from "@/types";
import { deleteProject, saveProject } from "./actions";

type ThemeOption = Pick<Theme, "id" | "number" | "title_ko" | "title_en">;

/** 프로젝트 편집: 왼쪽 내용 · 오른쪽 공개 · 연도 · 순서 · 리서치 분야 */
export function ProjectForm({
  project,
  themes,
  linkedThemeIds = [],
}: {
  project: Project;
  themes: ThemeOption[];
  /** 연결된 분야 id (position 순서, 첫 번째가 주 분야) */
  linkedThemeIds?: string[];
}) {
  const { action, onDelete, deleting } = useEditorActions({
    save: saveProject.bind(null, project.id),
    remove: () => deleteProject(project.id),
    confirmDelete: "이 프로젝트를 삭제할까요? 되돌릴 수 없습니다.",
    listHref: ROUTES.projects,
  });
  const [selected, setSelected] = useState<string[]>(linkedThemeIds);
  const [primary, setPrimary] = useState(linkedThemeIds[0] ?? "");

  const toggleTheme = (id: string, checked: boolean) => {
    const next = checked ? [...selected, id] : selected.filter((t) => t !== id);
    setSelected(next);
    if (!next.includes(primary)) setPrimary(next[0] ?? "");
    else if (!primary && next.length) setPrimary(next[0]!);
  };

  return (
    <EditorForm
      action={action}
      back={{ href: ROUTES.projects, label: "Projects" }}
      title={project.title_ko || project.title_en || "제목 없음"}
      status={
        <>
          {project.is_nda ? <Badge tone="strong">NDA</Badge> : null}
          <PublishBadge published={project.is_published} />
        </>
      }
      onDelete={onDelete}
      deleting={deleting}
      inspector={
        <>
          <InspectorSection title="공개">
            <Switch
              label="사이트에 공개"
              name="is_published"
              defaultChecked={project.is_published}
            />
            <Switch
              label="NDA"
              name="is_nda"
              description="제목 · 기관 · 연도 · 분야만 공개합니다."
              defaultChecked={project.is_nda}
            />
          </InspectorSection>

          <InspectorSection title="주소">
            <Field
              label="주소 (slug) *"
              name="slug"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              defaultValue={project.slug}
              hint="사이트에서 이 프로젝트를 여는 링크 /projects#<slug> · 영문 소문자, 숫자, 하이픈"
            />
          </InspectorSection>

          <InspectorSection title="기간 · 순서">
            <div className={classNames("grid grid-cols-2 gap-3")}>
              <Field
                label="시작 연도 *"
                name="year_start"
                type="number"
                min={2000}
                max={2100}
                required
                defaultValue={project.year_start}
              />
              <Field
                label="끝 연도"
                name="year_end"
                type="number"
                min={2000}
                max={2100}
                defaultValue={project.year_end ?? ""}
                placeholder="한 해면 비움"
              />
            </div>
            <Field
              label="순서"
              name="sort_order"
              type="number"
              defaultValue={project.sort_order}
              hint="같은 해 안에서 작을수록 앞"
            />
          </InspectorSection>

          <InspectorSection
            title="리서치 분야"
            description="여러 개 고를 수 있습니다. ★ 주 분야가 먼저 표시됩니다."
          >
            <ul className={classNames("flex flex-col gap-1")}>
              {themes.map((theme) => {
                const checked = selected.includes(theme.id);
                const isPrimary = checked && primary === theme.id;
                return (
                  <li
                    key={theme.id}
                    className={classNames("flex items-center gap-1", "pr-1", [
                      "rounded-lg transition",
                      checked ? "bg-gray-100" : "hover:bg-field",
                    ])}
                  >
                    <label
                      className={classNames(
                        "min-h-10 min-w-0 flex-1",
                        "flex cursor-pointer items-center gap-3",
                        "px-3",
                      )}
                    >
                      <input
                        type="checkbox"
                        name="theme_ids"
                        value={theme.id}
                        checked={checked}
                        onChange={(e) =>
                          toggleTheme(theme.id, e.target.checked)
                        }
                        className={classNames(
                          "size-4 shrink-0",
                          "accent-black",
                        )}
                      />
                      <ThemeDot number={theme.number} size="sm" />
                      <span
                        className={classNames(
                          "font-neuehaas text-xs font-medium text-mute",
                        )}
                      >
                        {String(theme.number).padStart(2, "0")}
                      </span>
                      <span className={classNames("truncate text-sm")}>
                        {theme.title_ko || theme.title_en}
                      </span>
                    </label>
                    <label
                      title="주 분야"
                      className={classNames(
                        "size-8 shrink-0",
                        [
                          "flex items-center justify-center",
                          { invisible: !checked },
                        ],
                        "cursor-pointer rounded-md transition hover:bg-white has-focus-visible:ring-2 has-focus-visible:ring-black",
                        isPrimary ? "text-main" : "text-mute",
                      )}
                    >
                      <input
                        type="radio"
                        name="primary_theme"
                        value={theme.id}
                        checked={primary === theme.id}
                        onChange={() => setPrimary(theme.id)}
                        disabled={!checked}
                        aria-label="주 분야"
                        className={classNames("sr-only")}
                      />
                      {isPrimary ? "★" : "☆"}
                    </label>
                  </li>
                );
              })}
            </ul>
          </InspectorSection>
        </>
      }
    >
      <EditorSection title="기본 정보">
        <BilingualField
          label="프로젝트 제목"
          name="title"
          required
          defaults={[project.title_ko, project.title_en]}
        />
        <BilingualField
          label="협력 기관"
          name="client"
          defaults={[project.client_ko, project.client_en]}
        />
      </EditorSection>

      <EditorSection title="내용">
        <BilingualField
          label="프로젝트 분야 (해시태그)"
          name="tags"
          hint="쉼표(,)나 줄바꿈으로 구분합니다."
          defaults={[project.tags_ko.join(", "), project.tags_en.join(", ")]}
        />
        <BilingualField
          label="프로젝트 설명"
          name="description"
          multiline
          rows={8}
          defaults={[project.description_ko, project.description_en]}
        />
      </EditorSection>
    </EditorForm>
  );
}
