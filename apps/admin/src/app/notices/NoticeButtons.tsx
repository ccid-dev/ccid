"use client";

import classNames from "classnames";
import { useRouter } from "next/navigation";
import { useActionState, useTransition } from "react";
import { Button, type ButtonStyle } from "@repo/common";
import type { FormState } from "@/app/actions/auth";
import { ModalButton, useCreateForm } from "@/components/create";
import { Field, ModalForm, Switch, TextArea } from "@/components/forms";
import { ROUTES } from "@/constants";
import { closeModal } from "@/libs/modal";
import { notify } from "@/libs/toast";
import type { Notice } from "@/types";
import {
  createNotice,
  deleteNotice,
  setNoticePinned,
  updateNotice,
} from "./actions";

/** 제목 · 내용 · (메인테이너) 고정 칸 */
function NoticeFields({
  notice,
  canPin,
}: {
  notice?: Pick<Notice, "title" | "body" | "pinned">;
  canPin: boolean;
}) {
  return (
    <>
      <Field
        label="제목 *"
        name="title"
        required
        maxLength={200}
        autoFocus
        defaultValue={notice?.title ?? ""}
      />
      <TextArea
        label="내용"
        name="body"
        rows={9}
        defaultValue={notice?.body ?? ""}
        hint="줄바꿈이 그대로 보입니다."
      />
      {canPin ? (
        <Switch
          label="맨 위에 고정"
          name="pinned"
          description="고정한 공지는 목록과 대시보드 맨 위에 보입니다."
          defaultChecked={notice?.pinned ?? false}
        />
      ) : null}
    </>
  );
}

function NewNoticeForm({ canPin }: { canPin: boolean }) {
  const [state, action] = useCreateForm(
    createNotice,
    (id) => `${ROUTES.notices}/${id}`,
  );
  return (
    <ModalForm action={action} error={state.error} submitLabel="올리기">
      <NoticeFields canPin={canPin} />
    </ModalForm>
  );
}

/** 새 공지 쓰기 (모달) */
export function NewNoticeButton({
  canPin,
  ...style
}: ButtonStyle & { canPin: boolean }) {
  return (
    <ModalButton
      {...style}
      modal={{
        title: "새 공지",
        description:
          "연구실 모두가 봅니다. 본인 글은 나중에 고치거나 지울 수 있습니다.",
        content: <NewNoticeForm canPin={canPin} />,
      }}
    >
      새 공지
    </ModalButton>
  );
}

function EditNoticeForm({
  notice,
  canPin,
}: {
  notice: Notice;
  canPin: boolean;
}) {
  const [state, action] = useActionState<FormState, FormData>(
    async (prev, formData) => {
      const result = await updateNotice(notice.id, prev, formData);
      if (!result.error) {
        closeModal();
        notify(result);
      }
      return result;
    },
    {},
  );
  return (
    <ModalForm action={action} error={state.error} submitLabel="저장">
      <NoticeFields notice={notice} canPin={canPin} />
    </ModalForm>
  );
}

/** 공지 보기 화면의 버튼: 고치기 · 고정 · 지우기 (권한에 따라) */
export function NoticeActions({
  notice,
  canEdit,
  canPin,
}: {
  notice: Notice;
  canEdit: boolean;
  canPin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onDelete = () => {
    if (!confirm("이 공지를 지울까요? 되돌릴 수 없습니다.")) return;
    startTransition(async () => {
      const result = await deleteNotice(notice.id);
      notify(result);
      if (!result.error) router.push(ROUTES.notices);
    });
  };

  return (
    <div className={classNames("flex flex-wrap gap-2")}>
      {canPin ? (
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () =>
              notify(await setNoticePinned(notice.id, !notice.pinned)),
            )
          }
        >
          {notice.pinned ? "고정 풀기" : "맨 위에 고정"}
        </Button>
      ) : null}
      {canEdit ? (
        <>
          <ModalButton
            variant="outline"
            modal={{
              title: "공지 고치기",
              content: <EditNoticeForm notice={notice} canPin={canPin} />,
            }}
          >
            고치기
          </ModalButton>
          <Button
            variant="ghost"
            loading={pending}
            onClick={onDelete}
            className={classNames("text-red-700!")}
          >
            지우기
          </Button>
        </>
      ) : null}
    </div>
  );
}
