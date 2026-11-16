"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { VIEW_AS_COOKIE, requireMaster } from "@/libs/auth";

/** 메인테이너: "일반 멤버로 보기" 켜고 끄기 (화면만 바뀌고 권한은 그대로) */
export async function setViewAsMember(on: boolean) {
  await requireMaster();
  const store = await cookies();
  if (on)
    store.set(VIEW_AS_COOKIE, "member", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 12,
    });
  else store.delete(VIEW_AS_COOKIE);
  revalidatePath("/", "layout");
}
