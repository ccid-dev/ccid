import type { Metadata } from "next";
import { AdminPage, LoadError } from "@/components/ui";
import { requireMaster } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import { SiteForm } from "./SiteForm";

export const metadata: Metadata = { title: "Site" };

/** 사이트 전체 설정 (메인테이너) */
export default async function SitePage() {
  await requireMaster();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value");
  const settings = Object.fromEntries(
    (data ?? []).map((row) => [row.key, row.value]),
  );

  return (
    <AdminPage
      title="Site"
      description="사이트 전체에 쓰는 설정입니다. 저장하면 사이트에 1분 안에 반영됩니다."
    >
      {error ? (
        <LoadError message={error.message} />
      ) : (
        <SiteForm joinUrl={settings.join_url ?? ""} />
      )}
    </AdminPage>
  );
}
