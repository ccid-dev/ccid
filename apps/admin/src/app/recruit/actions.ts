"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/app/actions/auth";
import { ROUTES } from "@/constants";
import { requireMaster } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import { formBool, formText } from "@/utils";

/** 비어 있거나 http(s) 주소인지 */
const isLink = (value: string) => {
  if (!value) return true;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

/** 한/영 문구 칸 이름 */
const TEXT_FIELDS = [
  "eyebrow",
  "title",
  "description",
  "cta",
  "closed_title",
  "closed_message",
] as const;

/** 모집 설정 저장 (메인테이너). 사이트에는 최대 1분 뒤 반영됩니다. */
export async function saveRecruit(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireMaster();
  const isOpen = formBool(formData, "is_open");
  const applyUrl = formText(formData, "apply_url");
  if (!isLink(applyUrl))
    return { error: "지원 링크는 https:// 로 시작하는 주소여야 합니다." };
  if (isOpen && !applyUrl)
    return { error: "모집 중으로 열려면 지원 링크를 적어 주세요." };

  const texts = Object.fromEntries(
    TEXT_FIELDS.flatMap((field) => [
      [`${field}_ko`, formText(formData, `${field}_ko`)],
      [`${field}_en`, formText(formData, `${field}_en`)],
    ]),
  );

  const supabase = await createClient();
  const { error } = await supabase
    .from("recruit")
    .upsert({ id: 1, is_open: isOpen, apply_url: applyUrl, ...texts });
  if (error) return { error: `저장하지 못했습니다. (${error.message})` };

  revalidatePath(ROUTES.recruit);
  return {
    message: isOpen
      ? "저장했습니다. Join 버튼이 지원 링크로 연결됩니다. (사이트에는 1분 안에 반영)"
      : "저장했습니다. Join 버튼을 누르면 모집 기간이 아니라는 안내가 뜹니다. (사이트에는 1분 안에 반영)",
  };
}
