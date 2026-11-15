"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/app/actions/auth";
import { ROUTES } from "@/constants";
import { requireMaster } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import { formText } from "@/utils";

/** 비어 있거나 http(s) 주소인지 */
const isLink = (value: string) => {
  if (!value) return true;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

/** 사이트 설정 저장 (메인테이너). 사이트에는 최대 1분 뒤 반영됩니다. */
export async function saveSiteSettings(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireMaster();
  const joinUrl = formText(formData, "join_url");
  if (!isLink(joinUrl))
    return { error: "Join 링크는 https:// 로 시작하는 주소여야 합니다." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: "join_url", value: joinUrl });
  if (error) return { error: `저장하지 못했습니다. (${error.message})` };

  revalidatePath(ROUTES.site);
  return {
    message: joinUrl
      ? "저장했습니다. 사이트에는 1분 안에 반영됩니다."
      : "Join 링크를 비웠습니다. 사이트에서 Join 버튼이 숨겨집니다.",
  };
}
