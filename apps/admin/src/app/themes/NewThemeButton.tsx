"use client";

import classNames from "classnames";
import type { ButtonStyle } from "@repo/common";
import { ModalButton, useCreateForm } from "@/components/create";
import { BilingualField, Field, ModalForm } from "@/components/forms";
import { ROUTES } from "@/constants";
import { createTheme } from "./actions";

function NewThemeForm({ nextNumber }: { nextNumber: number }) {
  const [state, action] = useCreateForm(
    createTheme,
    (id) => `${ROUTES.themes}/${id}`,
  );
  return (
    <ModalForm action={action} error={state.error} submitLabel="만들고 편집">
      <BilingualField label="제목" name="title" required autoFocus />
      <div className={classNames("grid grid-cols-[96px_1fr] gap-3")}>
        <Field
          label="번호 *"
          name="number"
          type="number"
          min={1}
          required
          defaultValue={nextNumber}
        />
        <Field
          label="주소 (slug) *"
          name="slug"
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          placeholder="human-ai"
          hint="/research/<slug> · 영문 소문자, 숫자, 하이픈"
        />
      </div>
    </ModalForm>
  );
}

/** 새 리서치 분야 (모달 → 만들면 편집 화면으로) */
export function NewThemeButton({
  nextNumber,
  label = "새 분야",
  ...style
}: ButtonStyle & { nextNumber: number; label?: string; className?: string }) {
  return (
    <ModalButton
      {...style}
      modal={{
        title: "새 리서치 분야",
        description:
          "번호 · 주소 · 제목만 정하면 비공개로 만들어집니다. 나머지는 편집 화면에서 채웁니다.",
        content: <NewThemeForm nextNumber={nextNumber} />,
      }}
    >
      {label}
    </ModalButton>
  );
}
