import classNames from "classnames";
import Link from "next/link";
import { ProfileSummary } from "@/components/ProfileSummary";
import { AdminPage, Eyebrow } from "@/components/ui";
import { ROUTES } from "@/constants";
import { requireAdmin } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import { NewPersonButton } from "./people/NewPersonButton";
import { getAccountOptions } from "./people/data";
import { NewProjectButton } from "./projects/NewProjectButton";
import { NewThemeButton } from "./themes/NewThemeButton";

/** 카드 오른쪽 위 "+" 버튼 모양 */
const plusButton = {
  variant: "ghost",
  size: "sm",
  label: "+",
  className: classNames("w-8 px-0", "bg-white", "text-lg font-normal"),
} as const;

export default async function AdminHome() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const isMaster = admin.role === "master";
  const [themes, projects, people, mine] = await Promise.all([
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
  ]);

  const accounts = isMaster ? await getAccountOptions() : [];
  const nextNumber =
    Math.max(0, ...(themes.data ?? []).map((t) => t.number)) + 1;

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
      description="관리할 콘텐츠를 고르세요."
    >
      <ul className={classNames("grid gap-3 md:grid-cols-3")}>
        {cards.map((card) => {
          const published = card.rows.filter((row) => row.is_published).length;
          return (
            <li
              key={card.href}
              className={classNames(
                "min-h-56 md:min-h-72",
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
                      "font-neuehaas text-2xl font-medium tracking-[-0.02em] hover:underline",
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
                  "mt-auto pt-10",
                )}
              >
                <span
                  className={classNames(
                    "font-neuehaas text-7xl leading-[0.85] font-medium tracking-[-0.05em]",
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
        {!isMaster ? (
          <li
            className={classNames(
              "min-h-56 md:min-h-72",
              "flex flex-col justify-between gap-8",
              "p-8",
              "rounded-3xl bg-sheet/60",
            )}
          >
            <div>
              <Link
                href={ROUTES.profile}
                className={classNames(
                  "font-neuehaas text-2xl font-medium tracking-[-0.02em] hover:underline",
                )}
              >
                Profile
              </Link>
              <p className={classNames("text-sm text-sub")}>내 프로필</p>
            </div>
            {mine.data ? (
              <ProfileSummary person={mine.data} />
            ) : (
              <p className={classNames("text-sm text-sub")}>
                {admin.can_edit_profile
                  ? "아직 프로필이 없습니다. Profile 에서 만들 수 있습니다."
                  : "연결된 프로필이 없습니다."}
              </p>
            )}
          </li>
        ) : null}
      </ul>
    </AdminPage>
  );
}
