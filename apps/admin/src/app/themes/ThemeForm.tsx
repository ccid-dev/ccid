"use client";

import classNames from "classnames";
import Link from "next/link";
import {
  EditorForm,
  EditorSection,
  InspectorSection,
  useEditorActions,
} from "@/components/editor";
import { BilingualField, Field, Switch } from "@/components/forms";
import { ImageListField } from "@/components/ImageFields";
import { Badge, PublishBadge } from "@/components/ui";
import { ROUTES } from "@/constants";
import type { Theme } from "@/types";
import { deleteTheme, saveTheme } from "./actions";

/** 이 분야에 연결된 프로젝트 (오른쪽 목록) */
export type LinkedProject = {
  id: string;
  title: string;
  year: number;
  primary: boolean;
  published: boolean;
};

/** 리서치 분야 편집: 왼쪽 내용 · 이미지, 오른쪽 공개 · 번호 · 주소 · 연결된 프로젝트 */
export function ThemeForm({
  theme,
  projects,
}: {
  theme: Theme;
  projects: LinkedProject[];
}) {
  const { action, onDelete, deleting } = useEditorActions({
    save: saveTheme.bind(null, theme.id),
    remove: () => deleteTheme(theme.id),
    confirmDelete: projects.length
      ? `이 분야에 연결된 프로젝트 ${projects.length}개의 연결도 함께 사라집니다. (프로젝트는 남습니다)\n삭제할까요?`
      : "이 분야를 삭제할까요? 되돌릴 수 없습니다.",
    listHref: ROUTES.themes,
  });
  const pair = (ko: string, en: string): [string, string] => [ko, en];

  return (
    <EditorForm
      action={action}
      back={{ href: ROUTES.themes, label: "Research" }}
      title={`${String(theme.number).padStart(2, "0")} ${theme.title_ko || theme.title_en}`}
      status={<PublishBadge published={theme.is_published} />}
      onDelete={onDelete}
      deleting={deleting}
      inspector={
        <>
          <InspectorSection title="공개">
            <Switch
              label="사이트에 공개"
              name="is_published"
              defaultChecked={theme.is_published}
            />
          </InspectorSection>

          <InspectorSection title="번호 · 주소">
            <div className={classNames("grid grid-cols-[80px_1fr] gap-3")}>
              <Field
                label="번호 *"
                name="number"
                type="number"
                min={1}
                required
                defaultValue={theme.number}
              />
              <Field
                label="주소 (slug) *"
                name="slug"
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                defaultValue={theme.slug}
              />
            </div>
            <p className={classNames("text-xs text-mute")}>
              사이트 주소 /research/&lt;slug&gt; · 번호는 표시 순서입니다.
            </p>
          </InspectorSection>

          <InspectorSection
            title={`연결된 프로젝트 · ${projects.length}`}
            description="연결은 프로젝트 편집 화면의 ‘리서치 분야’에서 바꿉니다."
          >
            {projects.length ? (
              <ul className={classNames("-mx-2 flex flex-col")}>
                {projects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`${ROUTES.projects}/${project.id}`}
                      className={classNames(
                        "min-h-10",
                        "flex items-center gap-3",
                        "px-2",
                        "rounded-lg transition hover:bg-white/60",
                        "text-sm",
                      )}
                    >
                      <span
                        className={classNames(
                          "font-neuehaas text-xs font-medium text-mute",
                        )}
                      >
                        {project.year}
                      </span>
                      <span
                        className={classNames("min-w-0 flex-1", "truncate")}
                      >
                        {project.title}
                      </span>
                      {project.primary ? null : (
                        <Badge tone="muted">보조</Badge>
                      )}
                      {project.published ? null : (
                        <Badge tone="muted">비공개</Badge>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={classNames("text-sm text-mute")}>아직 없습니다.</p>
            )}
          </InspectorSection>
        </>
      }
    >
      <EditorSection title="기본 정보">
        <BilingualField
          label="제목"
          name="title"
          required
          defaults={pair(theme.title_ko, theme.title_en)}
          hint="영문 제목은 한국어 화면에서도 보조 제목으로 쓸 수 있습니다."
        />
        <BilingualField
          label="세부 분야 (키워드)"
          name="keywords"
          hint="쉼표(,)나 줄바꿈으로 구분합니다. 한국어가 비어 있으면 영어를 보여줍니다."
          defaults={pair(
            theme.keywords_ko.join(", "),
            theme.keywords_en.join(", "),
          )}
        />
      </EditorSection>

      <EditorSection title="소개">
        <BilingualField
          label="질문"
          name="question"
          multiline
          rows={2}
          hint="줄바꿈이 화면에 그대로 반영됩니다."
          defaults={pair(theme.question_ko, theme.question_en)}
        />
        <BilingualField
          label="캐치프레이즈"
          name="catchphrase"
          multiline
          rows={2}
          defaults={pair(theme.catchphrase_ko, theme.catchphrase_en)}
        />
        <BilingualField
          label="요약 설명"
          name="summary"
          multiline
          rows={3}
          hint="홈 · 목록 카드에 쓰는 짧은 설명"
          defaults={pair(theme.summary_ko, theme.summary_en)}
        />
        <BilingualField
          label="상세 설명"
          name="description"
          multiline
          rows={8}
          hint="분야 페이지 본문"
          defaults={pair(theme.description_ko, theme.description_en)}
        />
      </EditorSection>

      <EditorSection title="이미지">
        <ImageListField
          label="이미지"
          name="images"
          folder="themes"
          defaultValue={theme.images}
          hint="첫 번째가 대표 이미지입니다. 화살표로 순서를 바꿉니다. WebP 를 고르면 긴 변 2400px 이하로 줄여 WebP 로 저장합니다."
        />
        <BilingualField
          label="이미지 대체 텍스트"
          name="image_alt"
          defaults={pair(theme.image_alt_ko, theme.image_alt_en)}
        />
      </EditorSection>
    </EditorForm>
  );
}
