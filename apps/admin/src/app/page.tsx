import classNames from "classnames";
import Link from "next/link";
import type { ReactNode } from "react";
import { ProfileSummary } from "@/components/ProfileSummary";
import { AdminPage, Badge, Eyebrow, Panel } from "@/components/ui";
import { ROUTES, SUPABASE_FREE_LIMITS } from "@/constants";
import { getViewRole, requireAdmin } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import { formatDate } from "@/utils";
import { NewNoticeButton } from "./notices/NoticeButtons";
import { NewPersonButton } from "./people/NewPersonButton";
import { getAccountOptions } from "./people/data";
import { NewProjectButton } from "./projects/NewProjectButton";
import { getUsage } from "./system/checks";
import { NewThemeButton } from "./themes/NewThemeButton";

/** 카드 오른쪽 위 "+" 버튼 모양 */
const plusButton = {
  variant: "ghost",
  size: "sm",
  label: "+",
  className: classNames("w-8 px-0", "bg-white", "text-lg font-normal"),
} as const;

/** 대시보드 구역 머리 (제목 · 오른쪽 링크) */
function PanelHead({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children?: ReactNode;
}) {
  return (
    <div className={classNames("flex items-center justify-between gap-4")}>
      {href ? (
        <Link
          href={href}
          className={classNames(
            "font-neuehaas text-xl font-medium tracking-[-0.02em] hover:underline",
          )}
        >
          {title}
        </Link>
      ) : (
        <h2
          className={classNames(
            "font-neuehaas text-xl font-medium tracking-[-0.02em]",
          )}
        >
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

/** 확인할 일 한 줄 (이름 · 값 · 링크) */
function TodoRow({
  label,
  value,
  href,
  alert = false,
}: {
  label: string;
  value: ReactNode;
  href: string;
  alert?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className={classNames(
          "flex items-center justify-between gap-4",
          "-mx-3 px-3 py-2.5",
          "rounded-xl transition hover:bg-white",
          "text-sm",
        )}
      >
        <span className={classNames("flex items-center gap-2")}>
          {alert ? (
            <span
              aria-hidden
              className={classNames("size-1.5", "rounded-full bg-gold")}
            />
          ) : null}
          {label}
        </span>
        <span className={classNames("font-neuehaas font-medium")}>{value}</span>
      </Link>
    </li>
  );
}

/**
 * 대시보드 (역할마다 다름).
 * - 공통: 공지 (고정 먼저) · 콘텐츠 카드
 * - 메인테이너: 확인할 일 (승인 대기 · 비공개 콘텐츠 · 사용량)
 * - 일반 멤버(로 보기 포함): 내 프로필
 */
export default async function AdminHome() {
  const admin = await requireAdmin();
  const isMaster = (await getViewRole(admin)) === "master";
  const supabase = await createClient();

  const [themes, projects, people, mine, notices, pending, usage] =
    await Promise.all([
      supabase.from("themes").select("is_published, number"),
      supabase.from("projects").select("is_published"),
      isMaster
        ? supabase.from("people").select("is_published")
        : Promise.resolve({ data: [] }),
      isMaster
        ? Promise.resolve({ data: null })
        : supabase
            .from("people")
            .select("*")
            .eq("admin_user_id", admin.id)
            .maybeSingle(),
      supabase
        .from("notices")
        .select("id, title, pinned, author_name, created_at")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6),
      isMaster
        ? supabase
            .from("admin_users")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending")
        : Promise.resolve({ count: 0 }),
      isMaster ? getUsage() : Promise.resolve(null),
    ]);

  const accounts = isMaster ? await getAccountOptions() : [];
  const nextNumber =
    Math.max(0, ...(themes.data ?? []).map((t) => t.number)) + 1;
  const drafts = (rows: { is_published: boolean }[] | null) =>
    (rows ?? []).filter((row) => !row.is_published).length;
  const percent = (used: number, limit: number) =>
    `${((used / limit) * 100).toFixed(1)}%`;

  const cards = [
    {
      label: "Research",
      description: "리서치 분야",
      href: ROUTES.themes,
      create: <NewThemeButton nextNumber={nextNumber} {...plusButton} />,
      rows: themes.data ?? [],
    },
    {
      label: "Projects",
      description: "프로젝트",
      href: ROUTES.projects,
      create: <NewProjectButton {...plusButton} />,
      rows: projects.data ?? [],
    },
    ...(isMaster
      ? [
          {
            label: "People",
            description: "구성원",
            href: ROUTES.people,
            create: <NewPersonButton accounts={accounts} {...plusButton} />,
            rows: people.data ?? [],
          },
        ]
      : []),
  ];

  return (
    <AdminPage
      title={admin.name ? `${admin.name}님, 안녕하세요` : "안녕하세요"}
      description={
        isMaster
          ? "오늘 확인할 일과 연구실 소식입니다."
          : "연구실 소식과 내 프로필입니다."
      }
    >
      <div className={classNames("flex flex-col gap-3")}>
        <div className={classNames("grid gap-3 lg:grid-cols-3")}>
          {/* 공지 */}
          <Panel
            className={classNames("flex flex-col gap-4", "p-8 lg:col-span-2")}
          >
            <PanelHead title="Notices" href={ROUTES.notices}>
              <NewNoticeButton canPin={isMaster} variant="outline" size="sm" />
            </PanelHead>
            {notices.error ? (
              <p className={classNames("text-sm text-sub")}>
                공지를 불러오지 못했습니다.
                {isMaster
                  ? " 마이그레이션 20261116180000_notices_system.sql 을 실행했는지 확인해 주세요."
                  : ""}
              </p>
            ) : notices.data?.length ? (
              <ul className={classNames("-mx-3 flex flex-col")}>
                {notices.data.map((notice) => (
                  <li key={notice.id}>
                    <Link
                      href={`${ROUTES.notices}/${notice.id}`}
                      className={classNames(
                        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4",
                        "px-3 py-3",
                        "rounded-xl transition hover:bg-white",
                      )}
                    >
                      <span
                        className={classNames(
                          "flex min-w-0 items-center gap-2",
                        )}
                      >
                        {notice.pinned ? (
                          <Badge tone="strong">Pinned</Badge>
                        ) : null}
                        <span
                          className={classNames("truncate text-sm font-medium")}
                        >
                          {notice.title}
                        </span>
                      </span>
                      <span
                        className={classNames(
                          "font-neuehaas text-xs whitespace-nowrap text-sub",
                        )}
                      >
                        {notice.author_name} · {formatDate(notice.created_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={classNames("text-sm text-sub")}>
                아직 공지가 없습니다.
              </p>
            )}
          </Panel>

          {/* 오른쪽: 메인테이너는 확인할 일, 일반 멤버는 내 프로필 */}
          {isMaster ? (
            <Panel className={classNames("flex flex-col gap-4", "p-8")}>
              <PanelHead title="확인할 일" />
              <ul className={classNames("flex flex-col")}>
                <TodoRow
                  label="가입 승인 대기"
                  value={`${pending.count ?? 0}명`}
                  href={ROUTES.members}
                  alert={(pending.count ?? 0) > 0}
                />
                <TodoRow
                  label="비공개 리서치 분야"
                  value={drafts(themes.data)}
                  href={ROUTES.themes}
                />
                <TodoRow
                  label="비공개 프로젝트"
                  value={drafts(projects.data)}
                  href={ROUTES.projects}
                />
                <TodoRow
                  label="비공개 구성원"
                  value={drafts(people.data)}
                  href={ROUTES.people}
                />
                {usage ? (
                  <>
                    <TodoRow
                      label="Database 사용량"
                      value={percent(
                        usage.database_bytes,
                        SUPABASE_FREE_LIMITS.databaseBytes,
                      )}
                      href={ROUTES.system}
                    />
                    <TodoRow
                      label="Storage 사용량"
                      value={percent(
                        usage.storage_bytes,
                        SUPABASE_FREE_LIMITS.storageBytes,
                      )}
                      href={ROUTES.system}
                    />
                  </>
                ) : (
                  <TodoRow
                    label="System Check"
                    value="확인 필요"
                    href={ROUTES.system}
                    alert
                  />
                )}
              </ul>
            </Panel>
          ) : (
            <Panel className={classNames("flex flex-col gap-6", "p-8")}>
              <PanelHead title="Profile" href={ROUTES.profile} />
              {mine.data ? (
                <ProfileSummary person={mine.data} />
              ) : (
                <p className={classNames("text-sm text-sub")}>
                  {admin.can_edit_profile
                    ? "아직 프로필이 없습니다. Profile 에서 만들 수 있습니다."
                    : "연결된 프로필이 없습니다. 필요하면 메인테이너에게 요청해 주세요."}
                </p>
              )}
            </Panel>
          )}
        </div>

        {/* 콘텐츠 */}
        <ul
          className={classNames(
            "grid gap-3",
            cards.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2",
          )}
        >
          {cards.map((card) => {
            const published = card.rows.filter(
              (row) => row.is_published,
            ).length;
            return (
              <li
                key={card.href}
                className={classNames(
                  "min-h-52",
                  "flex flex-col",
                  "p-8",
                  "rounded-3xl bg-sheet/60",
                )}
              >
                <div className={classNames("flex items-start justify-between")}>
                  <div>
                    <Link
                      href={card.href}
                      className={classNames(
                        "font-neuehaas text-xl font-medium tracking-[-0.02em] hover:underline",
                      )}
                    >
                      {card.label}
                    </Link>
                    <p className={classNames("text-sm text-sub")}>
                      {card.description}
                    </p>
                  </div>
                  {card.create}
                </div>
                <Link
                  href={card.href}
                  className={classNames(
                    "flex items-end justify-between gap-4",
                    "mt-auto pt-8",
                  )}
                >
                  <span
                    className={classNames(
                      "font-neuehaas text-6xl leading-[0.85] font-medium tracking-[-0.05em]",
                    )}
                  >
                    {card.rows.length}
                  </span>
                  <span className={classNames("text-right")}>
                    <Eyebrow muted>Published</Eyebrow>
                    <span className={classNames("font-neuehaas text-sm")}>
                      {published} / {card.rows.length}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </AdminPage>
  );
}
