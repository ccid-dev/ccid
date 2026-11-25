"use client";

import classNames from "classnames";
import { useTransition } from "react";
import { Button } from "@repo/common";
import { Badge } from "@/components/ui";
import { notify } from "@/libs/toast";
import type { Tables } from "@/types";
import { deleteInquiry, setInquiryStatus } from "./actions";
import {
  INQUIRY_STATUS_LABEL,
  INQUIRY_TOPIC_LABEL,
  type InquiryStatus,
} from "./labels";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

/** 문의 한 건: 보낸 사람 · 주제 · 상태 · 내용, 답장 메일 · 상태 바꾸기 · 지우기 */
export function InquiryRow({ inquiry }: { inquiry: Tables<"inquiries"> }) {
  const status = inquiry.status as InquiryStatus;
  const [pending, startTransition] = useTransition();

  const run = (task: () => Promise<{ error?: string }>, done: string) =>
    startTransition(async () => {
      const res = await task();
      notify(res.error ? res : { message: done });
    });

  const reply = `mailto:${inquiry.email}?subject=${encodeURIComponent(
    inquiry.lang === "en" ? "Re: your message to cciD" : "Re: cciD 문의",
  )}`;

  const actions: { label: string; onClick: () => void; danger?: boolean }[] = [
    ...(status !== "read"
      ? [
          {
            label: status === "new" ? "읽음으로" : "읽음으로 되돌리기",
            onClick: () =>
              run(
                () => setInquiryStatus(inquiry.id, "read"),
                "읽음으로 바꿨습니다.",
              ),
          },
        ]
      : []),
    ...(status !== "done"
      ? [
          {
            label: "처리 완료",
            onClick: () =>
              run(
                () => setInquiryStatus(inquiry.id, "done"),
                "처리 완료로 바꿨습니다.",
              ),
          },
        ]
      : []),
    {
      label: "지우기",
      danger: true,
      onClick: () => {
        if (
          !confirm(`${inquiry.name} 님의 문의를 지울까요? 되돌릴 수 없습니다.`)
        )
          return;
        run(() => deleteInquiry(inquiry.id), "문의를 지웠습니다.");
      },
    },
  ];

  return (
    <li
      className={classNames(
        "flex flex-col gap-3",
        "px-8 py-5",
        status === "done" && "opacity-60",
      )}
    >
      <div
        className={classNames(
          "flex flex-wrap items-center justify-between gap-x-6 gap-y-2",
        )}
      >
        <div className={classNames("min-w-0", "flex flex-col")}>
          <p className={classNames("text-sm font-medium")}>
            {inquiry.name}
            {inquiry.organization ? (
              <span className={classNames("ml-2", "font-normal text-sub")}>
                {inquiry.organization}
              </span>
            ) : null}
          </p>
          <a
            href={reply}
            className={classNames(
              "text-xs text-sub underline-offset-2 hover:underline",
            )}
          >
            {inquiry.email}
          </a>
        </div>
        <div className={classNames("flex flex-wrap items-center gap-1.5")}>
          <Badge>{INQUIRY_TOPIC_LABEL[inquiry.topic] ?? inquiry.topic}</Badge>
          <Badge tone={status === "new" ? "strong" : "muted"} dot>
            {INQUIRY_STATUS_LABEL[status] ?? status}
          </Badge>
          <span className={classNames("ml-1", "text-xs text-mute")}>
            {formatDate(inquiry.created_at)} ·{" "}
            {inquiry.lang === "en" ? "EN" : "KO"}
          </span>
        </div>
      </div>

      <p
        className={classNames(
          "p-4",
          "rounded-2xl bg-white",
          "text-sm whitespace-pre-line text-main",
        )}
      >
        {inquiry.message}
      </p>

      <div className={classNames("flex flex-wrap gap-1")}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            window.location.href = reply;
            if (status === "new")
              run(
                () => setInquiryStatus(inquiry.id, "read"),
                "답장 메일을 열었습니다.",
              );
          }}
        >
          답장 메일 쓰기
        </Button>
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={action.onClick}
            className={classNames({ "text-red-700!": action.danger })}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </li>
  );
}
