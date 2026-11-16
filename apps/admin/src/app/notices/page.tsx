import classNames from "classnames";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPage, Badge, Eyebrow, LoadError, Panel } from "@/components/ui";
import { ROUTES } from "@/constants";
import { getViewRole, requireAdmin } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import { formatDate } from "@/utils";
import { NewNoticeButton } from "./NoticeButtons";

export const metadata: Metadata = { title: "Notices" };

/** 공지사항 목록: 고정 글이 먼저, 그다음 최신순 */
export default async function NoticesPage() {
  const me = await requireAdmin();
  const viewRole = await getViewRole(me);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notices")
    .select("id, title, body, pinned, author_id, author_name, created_at")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  const notices = data ?? [];
  // 댓글 수 (댓글 표가 아직 없으면 그냥 숨김)
  const { data: commentRows } = await supabase
    .from("notice_comments")
    .select("notice_id");
  const commentCount = new Map<string, number>();
  for (const row of commentRows ?? [])
    commentCount.set(row.notice_id, (commentCount.get(row.notice_id) ?? 0) + 1);
  const columns =
    "grid gap-x-6 gap-y-1 md:grid-cols-[64px_minmax(0,1fr)_140px_110px] md:items-center";

  return (
    <AdminPage
      title="Notices"
      description="연구실 공지입니다. 누구나 쓸 수 있고, 고정은 메인테이너가 합니다."
      actions={<NewNoticeButton canPin={viewRole === "master"} />}
    >
      {error ? (
        <LoadError message={error.message} />
      ) : (
        <Panel className={classNames("overflow-hidden")}>
          <div
            className={classNames(
              ["hidden md:grid", columns],
              "px-8 pt-5 pb-3",
            )}
          >
            {["", "Title", "Author", "Date"].map((head) => (
              <Eyebrow key={head || "pin"} muted>
                {head}
              </Eyebrow>
            ))}
          </div>
          <ul className={classNames("divide-y divide-white")}>
            {notices.map((notice) => (
              <li key={notice.id}>
                <Link
                  href={`${ROUTES.notices}/${notice.id}`}
                  className={classNames(
                    columns,
                    "px-8 py-4",
                    "transition hover:bg-sheet",
                  )}
                >
                  <span>
                    {notice.pinned ? <Badge tone="strong">고정</Badge> : null}
                  </span>
                  <span className={classNames("min-w-0")}>
                    <span
                      className={classNames(
                        "block",
                        "truncate text-sm font-medium",
                      )}
                    >
                      {notice.title}
                      {commentCount.get(notice.id) ? (
                        <span
                          className={classNames(
                            "ml-2",
                            "font-neuehaas text-xs font-normal text-sub",
                          )}
                        >
                          댓글 {commentCount.get(notice.id)}
                        </span>
                      ) : null}
                    </span>
                    {notice.body ? (
                      <span
                        className={classNames(
                          "block",
                          "truncate text-xs text-sub",
                        )}
                      >
                        {notice.body}
                      </span>
                    ) : null}
                  </span>
                  <span className={classNames("truncate text-sm text-sub")}>
                    {notice.author_name || "(이름 없음)"}
                    {notice.author_id === me.id ? " · 나" : ""}
                  </span>
                  <span
                    className={classNames("font-neuehaas text-sm text-sub")}
                  >
                    {formatDate(notice.created_at)}
                  </span>
                </Link>
              </li>
            ))}
            {!notices.length ? (
              <li className={classNames("px-8 py-10", "text-sm text-sub")}>
                아직 공지가 없습니다.
              </li>
            ) : null}
          </ul>
        </Panel>
      )}
    </AdminPage>
  );
}
