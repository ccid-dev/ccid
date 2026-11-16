import classNames from "classnames";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileSummary } from "@/components/ProfileSummary";
import { AdminPage, Panel } from "@/components/ui";
import { ROUTES } from "@/constants";
import { isViewingAsMember, requireAdmin } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import { NewMyProfileButton } from "../people/NewPersonButton";
import { PersonForm } from "../people/PersonForm";

export const metadata: Metadata = { title: "Profile" };

/**
 * 일반 멤버의 내 프로필 (사이트 People 에 보이는 정보).
 * 메인테이너는 People 화면 맨 위에서 관리하므로 그쪽으로 보냅니다.
 */
export default async function ProfilePage() {
  const me = await requireAdmin();
  if (me.role === "master" && !(await isViewingAsMember(me)))
    redirect(ROUTES.people);

  const supabase = await createClient();
  const { data: person } = await supabase
    .from("people")
    .select("*")
    .eq("admin_user_id", me.id)
    .maybeSingle();

  if (person && me.can_edit_profile)
    return (
      <PersonForm key={person.updated_at} mode="self" person={person} isMine />
    );

  return (
    <AdminPage
      title="Profile"
      description="사이트 People 페이지에 보이는 내 정보입니다."
    >
      <Panel className={classNames("max-w-4xl", "flex flex-col gap-6", "p-8")}>
        {person ? <ProfileSummary person={person} /> : null}
        <div
          className={classNames(
            "flex flex-wrap items-center justify-between gap-4",
          )}
        >
          <p className={classNames("text-sm text-sub")}>
            {person
              ? "프로필을 고칠 권한이 아직 없습니다. 고쳐야 하면 메인테이너에게 요청해 주세요."
              : me.can_edit_profile
                ? "아직 프로필이 없습니다. 만들면 비공개로 시작하고, 메인테이너가 공개하면 사이트에 보입니다."
                : "아직 연결된 프로필이 없고, 프로필을 만들 권한도 없습니다. 필요하면 메인테이너에게 요청해 주세요."}
          </p>
          {!person && me.can_edit_profile ? <NewMyProfileButton /> : null}
        </div>
      </Panel>
    </AdminPage>
  );
}
