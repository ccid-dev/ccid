"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/app/actions/auth";
import { ROUTES } from "@/constants";
import { requireMaster } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import { INQUIRY_STATUSES, type InquiryStatus } from "./labels";

/** 문의 처리 상태 바꾸기 (메인테이너). 문의 내용은 고치지 않습니다. */
export async function setInquiryStatus(
  id: string,
  status: InquiryStatus,
): Promise<FormState> {
  await requireMaster();
  if (!INQUIRY_STATUSES.includes(status))
    return { error: "잘못된 상태입니다." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .update({ status })
    .eq("id", id)
    .select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "문의를 찾지 못했습니다." };
  revalidatePath(ROUTES.inquiries);
  return {};
}

/** 문의 지우기 (메인테이너). 되돌릴 수 없습니다. */
export async function deleteInquiry(id: string): Promise<FormState> {
  await requireMaster();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "문의를 찾지 못했습니다." };
  revalidatePath(ROUTES.inquiries);
  return {};
}
