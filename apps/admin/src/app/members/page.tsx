import classNames from "classnames";
import type { Metadata } from "next";
import { AdminPage, Badge, LoadError, Panel } from "@/components/ui";
import { requireMaster } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import { MemberRow, type PersonOption } from "./MemberRow";

export const metadata: Metadata = { title: "Lab Members" };

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  approved: 1,
  suspended: 2,
  rejected: 3,
};

export default async function MembersPage() {
  const me = await requireMaster();
  const supabase = await createClient();
  const [{ data, error }, { data: peopleRows }] = await Promise.all([
    supabase
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase
      .from("people")
      .select("id, name_ko, name_en, category, admin_user_id")
      .order("category")
      .order("sort_order"),
  ]);

  const users = [...(data ?? [])].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9),
  );
  const people: PersonOption[] = (peopleRows ?? []).map((p) => ({
    id: p.id,
    name: p.name_ko || p.name_en,
    nameEn: p.name_en,
    category: p.category,
    accountId: p.admin_user_id,
  }));
  const pendingCount = users.filter((u) => u.status === "pending").length;

  return (
    <AdminPage
      title="Lab Members"
      description={
        <>
          가입 승인, People 연결, 프로필 권한, 정지 · 삭제, 비밀번호 재설정
          링크를 관리합니다.
          {pendingCount ? (
            <Badge tone="strong">승인 대기 {pendingCount}</Badge>
          ) : null}
        </>
      }
    >
      {error ? (
        <LoadError message={error.message} />
      ) : (
        <Panel className={classNames("overflow-hidden")}>
          <ul className={classNames("divide-y")}>
            {users.map((user) => (
              <MemberRow
                key={user.id}
                user={user}
                isMe={user.id === me.id}
                people={people}
              />
            ))}
          </ul>
        </Panel>
      )}
    </AdminPage>
  );
}
