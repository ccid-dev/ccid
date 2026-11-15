import classNames from "classnames";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@repo/common";
import { signOut } from "@/app/actions/auth";
import { AuthCard } from "@/components/AuthCard";
import { ROUTES } from "@/constants";
import { getCurrentAdmin } from "@/libs/auth";

export const metadata: Metadata = { title: "승인 대기" };

export default async function PendingPage() {
  const current = await getCurrentAdmin();
  if (!current) redirect(ROUTES.login);
  if (current.profile?.status === "approved") redirect(ROUTES.home);

  const status = current.profile?.status;
  const copy =
    status === "suspended"
      ? {
          title: "사용이 정지된 계정",
          description:
            "이 계정은 메인테이너가 사용을 정지했습니다. 필요하면 메인테이너에게 문의해 주세요.",
        }
      : status === "rejected"
        ? {
            title: "승인되지 않은 계정",
            description:
              "이 계정은 사용이 승인되지 않았습니다. 필요하면 메인테이너에게 문의해 주세요.",
          }
        : {
            title: "승인을 기다리고 있습니다",
            description:
              "메인테이너가 가입을 승인하면 콘텐츠를 관리할 수 있습니다. 승인 후 다시 들어와 주세요.",
          };

  return (
    <AuthCard title={copy.title} description={copy.description}>
      {current.profile ? (
        <p className={classNames("mb-6", "text-sm")}>
          {current.profile.name} · {current.profile.email}
        </p>
      ) : null}
      <form action={signOut}>
        <Button type="submit" variant="outline" size="lg" block>
          로그아웃
        </Button>
      </form>
    </AuthCard>
  );
}
