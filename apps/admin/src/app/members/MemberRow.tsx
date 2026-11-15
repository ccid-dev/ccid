"use client";

import classNames from "classnames";
import { useState, useTransition } from "react";
import { Button } from "@repo/common";
import { Select } from "@/components/forms";
import { Badge } from "@/components/ui";
import {
  ADMIN_ROLE_LABEL,
  ADMIN_STATUS_LABEL,
  PERSON_CATEGORY_LABEL,
  type AdminRole,
  type AdminStatus,
  type AdminUser,
  type PersonCategory,
} from "@/types";
import { notify, toast } from "@/libs/toast";
import {
  createResetLink,
  deleteMember,
  saveMemberAccess,
  updateMember,
} from "./actions";

/** People 연결 고르기에 쓰는 구성원 */
export type PersonOption = {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  /** 이미 연결된 계정 */
  accountId: string | null;
};

const normalize = (value: string) => value.trim().toLowerCase();

/** 계정 한 줄: 정보 · 상태 · 버튼, 펼치면 People 연결 · 권한 / 재설정 링크 */
export function MemberRow({
  user,
  isMe,
  people,
}: {
  user: AdminUser;
  isMe: boolean;
  people: PersonOption[];
}) {
  const role = user.role as AdminRole;
  const status = user.status as AdminStatus;
  const linked = people.find((p) => p.accountId === user.id);
  /** 이름이 같은 (아직 연결되지 않은) 구성원을 먼저 제안합니다. */
  const suggested = people.find(
    (p) =>
      !p.accountId &&
      user.name &&
      [p.name, p.nameEn].some(
        (n) => n && normalize(n) === normalize(user.name),
      ),
  );

  const [panel, setPanel] = useState<"access" | "approve" | "link" | null>(
    null,
  );
  const [resetLink, setResetLink] = useState<string>();
  const [pending, startTransition] = useTransition();

  const run = (
    task: () => Promise<{ error?: string; message?: string }>,
    done?: string,
  ) =>
    startTransition(async () => {
      const res = await task();
      notify(res.error || res.message ? res : { message: done });
    });

  const openPanel = (next: typeof panel) =>
    setPanel(panel === next ? null : next);

  const onReset = () =>
    startTransition(async () => {
      const res = await createResetLink(user.id);
      notify(res.link ? { message: "재설정 링크를 만들었습니다." } : res);
      setResetLink(res.link);
      setPanel(res.link ? "link" : null);
    });

  const onDelete = () => {
    const warning = linked
      ? `${user.email} 계정을 삭제할까요?\n연결된 People 프로필(${linked.name})은 남고 연결만 풀립니다.`
      : `${user.email} 계정을 삭제할까요? 되돌릴 수 없습니다.`;
    if (!confirm(warning)) return;
    run(() => deleteMember(user.id), `${user.email} 계정을 삭제했습니다.`);
  };

  /** 상태별 버튼 */
  const actions: {
    label: string;
    onClick: () => void;
    tone?: "danger";
  }[] = isMe
    ? [{ label: "재설정 링크", onClick: onReset }]
    : status === "pending" || status === "rejected"
      ? [
          { label: "승인…", onClick: () => openPanel("approve") },
          ...(status === "pending"
            ? [
                {
                  label: "거절",
                  onClick: () =>
                    run(
                      () => updateMember(user.id, { status: "rejected" }),
                      "가입을 거절했습니다.",
                    ),
                },
              ]
            : []),
          { label: "삭제", onClick: onDelete, tone: "danger" as const },
        ]
      : status === "suspended"
        ? [
            {
              label: "정지 해제",
              onClick: () =>
                run(
                  () => updateMember(user.id, { status: "approved" }),
                  "정지를 풀었습니다.",
                ),
            },
            { label: "삭제", onClick: onDelete, tone: "danger" as const },
          ]
        : [
            { label: "People · 권한", onClick: () => openPanel("access") },
            {
              label: role === "master" ? "일반으로" : "메인테이너로",
              onClick: () =>
                run(
                  () =>
                    updateMember(user.id, {
                      role: role === "master" ? "member" : "master",
                    }),
                  role === "master"
                    ? "일반 계정으로 바꿨습니다."
                    : "메인테이너로 바꿨습니다.",
                ),
            },
            {
              label: "정지",
              onClick: () =>
                run(
                  () => updateMember(user.id, { status: "suspended" }),
                  "계정을 정지했습니다.",
                ),
            },
            { label: "재설정 링크", onClick: onReset },
            { label: "삭제", onClick: onDelete, tone: "danger" as const },
          ];

  return (
    <li className={classNames("flex flex-col gap-3", "px-8 py-5")}>
      <div
        className={classNames(
          "grid gap-x-6 gap-y-3 md:grid-cols-[minmax(0,1fr)_160px_200px] xl:grid-cols-[minmax(0,1fr)_160px_200px_380px] md:items-center",
        )}
      >
        <div className={classNames("min-w-0", "flex items-center gap-3")}>
          <span
            aria-hidden
            className={classNames(
              "size-9 shrink-0",
              "flex items-center justify-center",
              "rounded-full bg-white",
              "font-neuehaas text-sm font-medium text-sub uppercase",
            )}
          >
            {(user.name || user.email).slice(0, 1)}
          </span>
          <div className={classNames("min-w-0")}>
            <p className={classNames("truncate", "text-sm font-medium")}>
              {user.name || "(이름 없음)"}
              {isMe ? (
                <span className={classNames("ml-2", "text-xs text-mute")}>
                  나 · 탈퇴는 Settings
                </span>
              ) : null}
            </p>
            <p className={classNames("truncate", "text-xs text-sub")}>
              {user.email}
            </p>
          </div>
        </div>

        <div className={classNames("flex flex-wrap gap-1.5")}>
          <Badge tone={role === "master" ? "strong" : "default"}>
            {ADMIN_ROLE_LABEL[role]}
          </Badge>
          <Badge tone={status === "approved" ? "default" : "muted"} dot>
            {ADMIN_STATUS_LABEL[status]}
          </Badge>
        </div>

        <div className={classNames("min-w-0", "flex flex-col")}>
          <span className={classNames("truncate", "text-sm")}>
            {linked ? linked.name : "People 없음"}
          </span>
          <span className={classNames("text-xs text-mute")}>
            {role === "master"
              ? "People 전체 관리"
              : user.can_edit_profile
                ? "본인 프로필 수정 가능"
                : "프로필 권한 없음"}
          </span>
        </div>

        <div
          className={classNames(
            "flex flex-wrap gap-1 md:col-span-3 xl:col-span-1 xl:justify-end",
          )}
        >
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={action.onClick}
              className={classNames({
                "text-red-700!": action.tone === "danger",
              })}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {panel === "access" || panel === "approve" ? (
        <AccessPanel
          key={panel}
          approve={panel === "approve"}
          user={user}
          people={people}
          defaultPersonId={linked?.id ?? suggested?.id ?? ""}
          pending={pending}
          onCancel={() => setPanel(null)}
          onSave={(personId, canEditProfile) =>
            run(async () => {
              const res = await saveMemberAccess(user.id, {
                personId: personId || null,
                canEditProfile,
                approve: panel === "approve",
              });
              if (!res.error) setPanel(null);
              return res;
            })
          }
        />
      ) : null}

      {panel === "link" && resetLink ? (
        <div
          className={classNames(
            "flex flex-col gap-2",
            "p-4",
            "rounded-2xl bg-white",
          )}
        >
          <p className={classNames("text-xs text-sub")}>
            비밀번호 재설정 링크 · 1시간 동안 한 번만 쓸 수 있습니다. 본인에게
            전달해 주세요.
          </p>
          <div className={classNames("flex gap-2")}>
            <input
              readOnly
              value={resetLink}
              onFocus={(e) => e.currentTarget.select()}
              className={classNames(
                "h-9 min-w-0 flex-1",
                "px-3",
                "rounded-lg border border-black/5 bg-sheet/40 outline-none",
                "font-neuehaas text-xs text-sub",
              )}
            />
            <Button
              size="sm"
              onClick={() =>
                navigator.clipboard
                  .writeText(resetLink)
                  .then(() => toast("링크를 복사했습니다."))
              }
            >
              복사
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

/** People 연결 · 본인 프로필 권한 (승인할 때 함께 고름) */
function AccessPanel({
  approve,
  user,
  people,
  defaultPersonId,
  pending,
  onCancel,
  onSave,
}: {
  approve: boolean;
  user: AdminUser;
  people: PersonOption[];
  defaultPersonId: string;
  pending: boolean;
  onCancel: () => void;
  onSave: (personId: string, canEditProfile: boolean) => void;
}) {
  const [personId, setPersonId] = useState(defaultPersonId);
  const [canEdit, setCanEdit] = useState(
    approve ? true : user.can_edit_profile,
  );
  const options = people.filter((p) => !p.accountId || p.accountId === user.id);

  return (
    <div
      className={classNames(
        "grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end",
        "p-4",
        "rounded-2xl bg-white",
      )}
    >
      <Select
        label="People 연결"
        value={personId}
        onChange={(e) => setPersonId(e.target.value)}
        hint={
          personId
            ? "이 계정이 이 구성원의 프로필을 맡습니다."
            : "연결하지 않으면, 권한이 있을 때 본인이 Profile 에서 새로 만듭니다."
        }
      >
        <option value="">연결 안 함 (새로 만들기)</option>
        {options.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name} ·{" "}
            {PERSON_CATEGORY_LABEL[person.category as PersonCategory]}
          </option>
        ))}
      </Select>
      <label
        className={classNames(
          "flex items-start gap-3",
          "px-3.5 py-2.5",
          "rounded-lg border border-black/5 bg-white",
        )}
      >
        <input
          type="checkbox"
          checked={canEdit}
          onChange={(e) => setCanEdit(e.target.checked)}
          className={classNames("size-4 shrink-0", "mt-0.5", "accent-black")}
        />
        <span>
          <span className={classNames("text-sm font-medium")}>
            본인 프로필 만들기 · 고치기 권한
          </span>
          <span className={classNames("block", "text-xs text-sub")}>
            공개 여부 · 그룹 · 순서는 메인테이너가 정합니다.
          </span>
        </span>
      </label>
      <div className={classNames("flex gap-1")}>
        <Button variant="ghost" onClick={onCancel} disabled={pending}>
          취소
        </Button>
        <Button loading={pending} onClick={() => onSave(personId, canEdit)}>
          {approve ? "승인" : "저장"}
        </Button>
      </div>
    </div>
  );
}
