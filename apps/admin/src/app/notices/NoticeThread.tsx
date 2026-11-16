"use client";

import classNames from "classnames";
import { useActionState, useRef, useTransition } from "react";
import { Button } from "@repo/common";
import type { FormState } from "@/app/actions/auth";
import { SubmitButton, TextArea } from "@/components/forms";
import { Panel } from "@/components/ui";
import { notify } from "@/libs/toast";
import { formatDateTime } from "@/utils";
import { addComment, deleteComment, toggleReaction } from "./actions";
import { NOTICE_REACTIONS } from "./reactions";

export type ReactionSummary = {
  emoji: string;
  count: number;
  names: string[];
  mine: boolean;
};

export type CommentItem = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  mine: boolean;
  canDelete: boolean;
};

/** 반응 버튼 묶음: 이모지 · 수 · 누른 사람(마우스를 올리면) */
export function NoticeReactions({
  noticeId,
  reactions,
}: {
  noticeId: string;
  reactions: ReactionSummary[];
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div
      role="group"
      aria-label="반응"
      className={classNames("self-end w-full flex flex-wrap gap-1.5")}
    >
      {NOTICE_REACTIONS.map((emoji) => {
        const reaction = reactions.find((r) => r.emoji === emoji);
        const mine = reaction?.mine ?? false;
        const count = reaction?.count ?? 0;
        return (
          <button
            key={emoji}
            type="button"
            disabled={pending}
            aria-pressed={mine}
            title={reaction?.names.join(", ") || "아직 없음"}
            onClick={() =>
              startTransition(async () =>
                notify(await toggleReaction(noticeId, emoji, !mine)),
              )
            }
            className={classNames(
              "h-9",
              "inline-flex items-center gap-1.5",
              "px-3",
              [
                "rounded-full transition disabled:opacity-60",
                mine ? "bg-black" : "bg-white hover:bg-sheet",
              ],
              ["font-neuehaas text-sm", mine ? "text-white" : "text-main"],
            )}
          >
            <span aria-hidden>{emoji}</span>
            {count ? <span>{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/** 댓글 목록 · 쓰기 */
export function NoticeComments({
  noticeId,
  comments,
}: {
  noticeId: string;
  comments: CommentItem[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [, action] = useActionState<FormState, FormData>(
    async (prev, formData) => {
      const result = await addComment(noticeId, prev, formData);
      notify(result);
      if (!result.error) formRef.current?.reset();
      return result;
    },
    {},
  );
  const [deleting, startDelete] = useTransition();

  return (
    <Panel className={classNames("flex flex-col gap-6", "p-8 md:p-10")}>
      <h2 className={classNames("font-neuehaas text-xl font-medium")}>
        댓글 {comments.length ? comments.length : ""}
      </h2>

      {comments.length ? (
        <ul className={classNames("flex flex-col gap-2")}>
          {comments.map((comment) => (
            <li
              key={comment.id}
              className={classNames(
                "flex flex-col gap-2",
                "p-5",
                "rounded-2xl bg-white",
              )}
            >
              <div
                className={classNames(
                  "flex items-center justify-between gap-4",
                )}
              >
                <span className={classNames("text-sm font-medium")}>
                  {comment.authorName || "(이름 없음)"}
                  {comment.mine ? (
                    <span className={classNames("ml-1.5", "text-xs text-mute")}>
                      나
                    </span>
                  ) : null}
                  <span
                    className={classNames(
                      "ml-2",
                      "font-neuehaas text-xs font-normal text-mute",
                    )}
                  >
                    {formatDateTime(comment.createdAt)}
                  </span>
                </span>
                {comment.canDelete ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={deleting}
                    onClick={() => {
                      if (!confirm("이 댓글을 지울까요?")) return;
                      startDelete(async () =>
                        notify(await deleteComment(comment.id, noticeId)),
                      );
                    }}
                    className={classNames("text-red-700!")}
                  >
                    지우기
                  </Button>
                ) : null}
              </div>
              <p
                className={classNames(
                  "text-sm leading-6 whitespace-pre-line break-keep",
                )}
              >
                {comment.body}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className={classNames("text-sm text-sub")}>
          아직 댓글이 없습니다. 첫 댓글을 남겨 보세요.
        </p>
      )}

      <form
        ref={formRef}
        action={action}
        className={classNames("flex flex-col gap-3")}
      >
        <TextArea
          name="body"
          rows={3}
          required
          maxLength={2000}
          placeholder="댓글을 남겨 주세요."
          aria-label="댓글"
        />
        <div className={classNames("flex justify-end")}>
          <SubmitButton size="md" pendingText="다는 중…">
            댓글 달기
          </SubmitButton>
        </div>
      </form>
    </Panel>
  );
}
