import classNames from "classnames";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { FormSection } from "@/components/forms";
import { AdminPage } from "@/components/ui";
import { requireAdmin } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import {
  ADMIN_ROLE_LABEL,
  ADMIN_STATUS_LABEL,
  type AdminRole,
  type AdminStatus,
} from "@/types";
import { NameForm } from "./NameForm";
import { WithdrawForm } from "./WithdrawForm";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const me = await requireAdmin();
  const supabase = await createClient();
  const { data: person } = await supabase
    .from("people")
    .select("name_ko, name_en")
    .eq("admin_user_id", me.id)
    .maybeSingle();

  const rows: [string, ReactNode][] = [
    ["이름", <NameForm key="name" name={me.name} />],
    ["이메일", me.email],
    ["권한", ADMIN_ROLE_LABEL[me.role as AdminRole]],
    ["상태", ADMIN_STATUS_LABEL[me.status as AdminStatus]],
    [
      "People 프로필",
      person ? person.name_ko || person.name_en : "연결된 프로필 없음",
    ],
    [
      "프로필 권한",
      me.role === "master"
        ? "People 전체 관리"
        : me.can_edit_profile
          ? "본인 프로필 수정 가능"
          : "없음",
    ],
  ];

  return (
    <AdminPage title="Settings" description="내 계정 이름 · 정보와 탈퇴">
      <div className={classNames("max-w-5xl", "flex flex-col gap-2")}>
        <FormSection title="계정">
          <dl className={classNames("divide-y divide-white")}>
            {rows.map(([label, value]) => (
              <div
                key={label}
                className={classNames(
                  "grid grid-cols-[120px_1fr] items-baseline gap-4",
                  "py-3",
                  "text-sm",
                )}
              >
                <dt className={classNames("text-sub")}>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </FormSection>
        <FormSection
          title="탈퇴"
          description="계정을 지우면 다시 로그인할 수 없습니다. 다시 쓰려면 새로 가입하고 승인을 받아야 합니다."
        >
          {me.role === "master" ? (
            <p className={classNames("text-sm text-sub")}>
              메인테이너 계정은 탈퇴할 수 없습니다. 다른 메인테이너가 Lab
              Members 에서 이 계정을 일반으로 바꾼 뒤 탈퇴해 주세요.
            </p>
          ) : (
            <WithdrawForm
              profileName={
                person ? person.name_ko || person.name_en : undefined
              }
            />
          )}
        </FormSection>
      </div>
    </AdminPage>
  );
}
