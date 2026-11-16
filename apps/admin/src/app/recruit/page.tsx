import type { Metadata } from "next";
import { AdminPage, LoadError } from "@/components/ui";
import { requireMaster } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import { RecruitForm } from "./RecruitForm";

export const metadata: Metadata = { title: "Recruit" };

/** 모집 설정 (메인테이너): 모집 상태 · 지원 링크 · Join 문구 · 모집 중이 아닐 때 안내 */
export default async function RecruitPage() {
  await requireMaster();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recruit")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  return (
    <AdminPage
      title="Recruit"
      description="사이트 Join 구역의 문구와 버튼을 관리합니다. 모집을 열면 지원 링크로, 닫으면 안내 모달로 연결됩니다."
    >
      {error ? (
        <LoadError message={error.message} />
      ) : (
        <RecruitForm key={data?.updated_at ?? "new"} recruit={data} />
      )}
    </AdminPage>
  );
}
