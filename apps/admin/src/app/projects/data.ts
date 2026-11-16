import "server-only";

import { createClient } from "@/libs/supabase/server";

/** 리서치 분야 선택지 (번호순) */
export async function getThemeOptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("themes")
    .select("id, number, slug, title_ko, title_en, summary_ko, summary_en")
    .order("number");
  if (error) throw new Error(error.message);
  return data;
}
