import "server-only";

import { createClient } from "@/libs/supabase/server";
import type { AccountOption } from "./PersonForm";

/**
 * 구성원과 연결할 수 있는 계정 (메인테이너 전용 화면에서 사용).
 * 다른 구성원과 이미 연결된 계정은 빼고, 지금 이 구성원에 연결된 계정은 넣습니다.
 */
export async function getAccountOptions(
  currentAccountId?: string | null,
): Promise<AccountOption[]> {
  const supabase = await createClient();
  const [{ data: accounts }, { data: linked }] = await Promise.all([
    supabase
      .from("admin_users")
      .select("id, name, email, status")
      .in("status", ["approved", "pending"])
      .order("name"),
    supabase
      .from("people")
      .select("admin_user_id")
      .not("admin_user_id", "is", null),
  ]);
  const taken = new Set((linked ?? []).map((row) => row.admin_user_id));
  return (accounts ?? [])
    .filter((a) => a.id === currentAccountId || !taken.has(a.id))
    .map(({ id, name, email }) => ({ id, name, email }));
}
