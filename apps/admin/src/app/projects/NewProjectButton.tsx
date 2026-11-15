"use client";

import classNames from "classnames";
import type { ButtonStyle } from "@repo/common";
import { ModalButton, useCreateForm } from "@/components/create";
import { BilingualField, Field, ModalForm } from "@/components/forms";
import { ROUTES } from "@/constants";
import { createProject } from "./actions";

function NewProjectForm() {
  const [state, action] = useCreateForm(
    createProject,
    (id) => `${ROUTES.projects}/${id}`,
  );
  return (
    <ModalForm action={action} error={state.error} submitLabel="만들고 편집">
      <BilingualField label="프로젝트 제목" name="title" required autoFocus />
      <div className={classNames("grid grid-cols-[120px_1fr] gap-3")}>
        <Field
          label="시작 연도 *"
          name="year_start"
          type="number"
          min={2000}
          max={2100}
          required
          defaultValue={new Date().getFullYear()}
        />
        <Field
          label="주소 (slug)"
          name="slug"
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          placeholder="비우면 영문 제목으로"
          hint="공유 링크 /projects#<slug>"
        />
      </div>
    </ModalForm>
  );
}

/** 새 프로젝트 (모달 → 만들면 편집 화면으로) */
export function NewProjectButton({
  label = "새 프로젝트",
  ...style
}: ButtonStyle & { label?: string; className?: string }) {
  return (
    <ModalButton
      {...style}
      modal={{
        title: "새 프로젝트",
        description:
          "제목과 연도만 정하면 비공개로 만들어집니다. 나머지는 편집 화면에서 채웁니다.",
        content: <NewProjectForm />,
      }}
    >
      {label}
    </ModalButton>
  );
}
