import classNames from "classnames";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPage, Badge, Panel } from "@/components/ui";
import { ROUTES } from "@/constants";
import { getViewRole, requireAdmin } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import { formatDate } from "@/utils";
import { NoticeActions } from "../NoticeButtons";
import {
  NoticeComments,
  NoticeReactions,
  type ReactionSummary,
} from "../NoticeThread";

export const metadata: Metadata = { title: "공지" };

/** 오른쪽 "다른 공지"에 보여 줄 수 */
const OTHER_COUNT = 10;

/**
 * 공지 보기: 왼쪽 내용 · 반응 · 댓글, 오른쪽 다른 공지 목록.
 * (권한에 따라) 고치기 · 고정 · 지우기
 */
export default async function NoticePage({
  params,
}: PageProps<"/notices/[id]">) {
  const me = await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: notice }, { data: others }, comments, reactions] =
    await Promise.all([
      supabase.from("notices").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("notices")
        .select("id, title, pinned, author_name, created_at")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(OTHER_COUNT + 1),
      supabase
        .from("notice_comments")
        .select("id, author_id, author_name, body, created_at")
        .eq("notice_id", id)
        .order("created_at"),
      supabase
        .from("notice_reactions")
        .select("emoji, user_id, user_name")
        .eq("notice_id", id)
        .order("created_at"),
    ]);
  if (!notice) notFound();

  const isMaster = (await getViewRole(me)) === "master";
  const isMine = notice.author_id === me.id;
  const edited =
    notice.updated_at.slice(0, 16) !== notice.created_at.slice(0, 16);

  // 반응: 이모지별 수 · 누른 사람 · 내가 눌렀는지
  const summary = new Map<string, ReactionSummary>();
  for (const reaction of reactions.data ?? []) {
    const item = summary.get(reaction.emoji) ?? {
      emoji: reaction.emoji,
      count: 0,
      names: [],
      mine: false,
    };
    item.count += 1;
    item.names.push(reaction.user_name || "(이름 없음)");
    item.mine ||= reaction.user_id === me.id;
    summary.set(reaction.emoji, item);
  }
  const otherNotices = (others ?? [])
    .filter((other) => other.id !== notice.id)
    .slice(0, OTHER_COUNT);
  const threadReady = !comments.error && !reactions.error;

  return (
    <AdminPage
      title={notice.title}
      back={{ href: ROUTES.notices, label: "Notices" }}
      description={
        <>
          {notice.pinned ? <Badge tone="strong">고정</Badge> : null}
          <span>
            {notice.author_name || "(이름 없음)"}
            {isMine ? " · 나" : ""} · {formatDate(notice.created_at)}
            {edited ? ` · ${formatDate(notice.updated_at)} 수정` : ""}
          </span>
        </>
      }
      actions={
        <NoticeActions
          notice={notice}
          canEdit={isMaster || isMine}
          canPin={isMaster}
        />
      }
    >
      <div
        className={classNames(
          "grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start",
        )}
      >
        <div className={classNames("min-w-0", "flex flex-col gap-3")}>
          <Panel
            className={classNames(
              "flex flex-col justify-between gap-8",
              "min-h-[30svh]",
              "p-8 md:p-10",
            )}
          >
            {notice.body ? (
              <p
                className={classNames(
                  "max-w-3xl h-full",
                  "leading-7 whitespace-pre-line break-keep",
                )}
              >
                {notice.body}
              </p>
            ) : (
              <p className={classNames("text-sm text-sub h-full")}>
                내용이 없습니다.
              </p>
            )}
            {threadReady ? (
              <NoticeReactions
                noticeId={notice.id}
                reactions={[...summary.values()]}
              />
            ) : null}
          </Panel>

          {threadReady ? (
            <NoticeComments
              noticeId={notice.id}
              comments={(comments.data ?? []).map((comment) => ({
                id: comment.id,
                authorName: comment.author_name,
                body: comment.body,
                createdAt: comment.created_at,
                mine: comment.author_id === me.id,
                canDelete: isMaster || comment.author_id === me.id,
              }))}
            />
          ) : (
            <Panel className={classNames("p-8", "text-sm text-sub")}>
              댓글 · 반응을 쓰려면 마이그레이션
              20261116210000_notice_comments.sql 을 실행해 주세요.
            </Panel>
          )}
        </div>

        {/* 다른 공지 */}
        <Panel
          className={classNames(
            "flex flex-col gap-4",
            "p-6",
            "lg:sticky lg:top-6",
          )}
        >
          <div className={classNames("flex items-center justify-between")}>
            <h2 className={classNames("font-neuehaas text-base font-medium")}>
              다른 공지
            </h2>
            <Link
              href={ROUTES.notices}
              className={classNames(
                "font-neuehaas text-xs font-medium text-sub hover:text-main",
              )}
            >
              전체 보기 →
            </Link>
          </div>
          {otherNotices.length ? (
            <ul className={classNames("-mx-3 flex flex-col")}>
              {otherNotices.map((other) => (
                <li key={other.id}>
                  <Link
                    href={`${ROUTES.notices}/${other.id}`}
                    className={classNames(
                      "flex flex-col gap-0.5",
                      "px-3 py-2.5",
                      "rounded-xl transition hover:bg-white",
                    )}
                  >
                    <span
                      className={classNames("flex min-w-0 items-center gap-2")}
                    >
                      {other.pinned ? <Badge tone="strong">고정</Badge> : null}
                      <span className={classNames("truncate text-sm")}>
                        {other.title}
                      </span>
                    </span>
                    <span
                      className={classNames("font-neuehaas text-xs text-mute")}
                    >
                      {other.author_name} · {formatDate(other.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={classNames("text-sm text-sub")}>
              다른 공지가 없습니다.
            </p>
          )}
        </Panel>
      </div>
    </AdminPage>
  );
}
