import classNames from "classnames";
import type { Metadata } from "next";
import {
  AdminPage,
  ButtonLink,
  Eyebrow,
  LoadError,
  Panel,
} from "@/components/ui";
import { ROUTES } from "@/constants";
import { ProfileSummary } from "@/components/ProfileSummary";
import { requirePeopleManager } from "@/libs/auth";
import { mediaUrl } from "@/libs/media";
import { createClient } from "@/libs/supabase/server";
import { PERSON_CATEGORIES, PERSON_CATEGORY_LABEL } from "@/types";
import { NewPersonButton } from "./NewPersonButton";
import { SortablePeople } from "./SortablePeople";
import { getAccountOptions } from "./data";

export const metadata: Metadata = { title: "People" };

export default async function PeoplePage() {
  const me = await requirePeopleManager();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("people")
    .select(
      "id, category, name_ko, name_en, role_ko, role_en, image, is_published, sort_order, admin_user_id",
    )
    .order("sort_order")
    .order("created_at");
  const people = data ?? [];
  const accounts = await getAccountOptions();

  const publishedCount = people.filter((p) => p.is_published).length;
  const myProfile = people.find((p) => p.admin_user_id === me.id);

  return (
    <AdminPage
      title="People"
      description={`${people.length}명 · 공개 ${publishedCount}명`}
      actions={<NewPersonButton accounts={accounts} />}
    >
      {error ? (
        <LoadError message={error.message} />
      ) : (
        <div className={classNames("flex flex-col gap-3")}>
          <Panel
            className={classNames("grid gap-4 md:grid-cols-[240px_1fr]", "p-8")}
          >
            <div>
              <h2 className={classNames("font-neuehaas text-lg font-medium")}>
                내 프로필
              </h2>
              <Eyebrow muted className={classNames("mt-1")}>
                My profile
              </Eyebrow>
            </div>
            {myProfile ? (
              <ProfileSummary
                person={myProfile}
                actions={
                  <ButtonLink
                    href={`${ROUTES.people}/${myProfile.id}`}
                    variant="outline"
                    size="sm"
                  >
                    수정
                  </ButtonLink>
                }
              />
            ) : (
              <div
                className={classNames(
                  "flex flex-wrap items-center justify-between gap-4",
                )}
              >
                <p className={classNames("text-sm text-sub")}>
                  아직 내 계정과 연결된 프로필이 없습니다. 이미 있는 구성원이면
                  그 구성원 편집에서 &lsquo;계정 연결&rsquo;을 고르세요.
                </p>
                <NewPersonButton
                  accounts={accounts}
                  accountId={me.id}
                  label="내 프로필 만들기"
                  title="내 프로필 만들기"
                  size="sm"
                />
              </div>
            )}
          </Panel>

          {PERSON_CATEGORIES.map((category) => {
            const members = people.filter((p) => p.category === category);
            return (
              <Panel
                key={category}
                className={classNames(
                  "grid md:grid-cols-[240px_1fr]",
                  "overflow-hidden",
                )}
              >
                <div
                  className={classNames(
                    "flex items-start justify-between gap-4 md:flex-col md:justify-start",
                    "px-8 pt-8 pb-3 md:pb-8",
                  )}
                >
                  <div>
                    <h2
                      className={classNames(
                        "font-neuehaas text-lg font-medium break-keep",
                      )}
                    >
                      {PERSON_CATEGORY_LABEL[category]}
                    </h2>
                    <Eyebrow muted className={classNames("mt-1")}>
                      {members.length}명
                    </Eyebrow>
                  </div>
                  <NewPersonButton
                    accounts={accounts}
                    category={category}
                    label="+ 추가"
                    title={`새 구성원 · ${PERSON_CATEGORY_LABEL[category]}`}
                    variant="outline"
                    size="sm"
                  />
                </div>
                <SortablePeople
                  key={members.map((p) => `${p.id}:${p.sort_order}`).join()}
                  people={members.map((person) => ({
                    id: person.id,
                    name: person.name_ko || person.name_en,
                    nameEn:
                      person.name_ko && person.name_en ? person.name_en : "",
                    role: person.role_ko || person.role_en,
                    image: mediaUrl(person.image),
                    published: person.is_published,
                    account: person.admin_user_id
                      ? person.admin_user_id === me.id
                        ? "나"
                        : "계정"
                      : "",
                  }))}
                />
              </Panel>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
