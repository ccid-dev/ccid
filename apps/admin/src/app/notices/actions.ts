"use server";

import { revalidatePath } from "next/cache";
import type { CreateState, FormState } from "@/app/actions/auth";
import { ROUTES } from "@/constants";
import { requireAdmin, requireMaster } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import { formBool, formText } from "@/utils";
import { NOTICE_REACTIONS } from "./reactions";

const MAX_TITLE = 200;

const revalidateNotices = () => {
  revalidatePath(ROUTES.notices, "layout");
  revalidatePath(ROUTES.home);
};

/** 제목 · 내용 읽기 · 검사 */
function readNotice(formData: FormData) {
  const title = formText(formData, "title");
  const body = formText(formData, "body");
  if (!title) return { error: "제목을 입력해 주세요." } as const;
  if (title.length > MAX_TITLE)
    return { error: `제목은 ${MAX_TITLE}자 이하로 적어 주세요.` } as const;
  return { title, body } as const;
}

/**
 * 공지 쓰기 — 승인된 계정 누구나. 고정은 메인테이너만 (DB 트리거가 한 번 더 지킴)
 */
export async function createNotice(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  const me = await requireAdmin();
  const notice = readNotice(formData);
  if ("error" in notice) return { error: notice.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notices")
    .insert({
      title: notice.title,
      body: notice.body,
      pinned: me.role === "master" && formBool(formData, "pinned"),
    })
    .select("id")
    .single();
  if (error) return { error: `올리지 못했습니다. (${error.message})` };

  revalidateNotices();
  return { id: data.id, message: "공지를 올렸습니다." };
}

/** 공지 고치기 — 본인 글, 메인테이너는 모든 글 (DB 가 한 번 더 지킴) */
export async function updateNotice(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const me = await requireAdmin();
  const notice = readNotice(formData);
  if ("error" in notice) return { error: notice.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notices")
    .update({
      title: notice.title,
      body: notice.body,
      ...(me.role === "master" ? { pinned: formBool(formData, "pinned") } : {}),
    })
    .eq("id", id)
    .select("id");
  if (error) return { error: `고치지 못했습니다. (${error.message})` };
  if (!data.length) return { error: "본인 글만 고칠 수 있습니다." };

  revalidateNotices();
  return { message: "고쳤습니다." };
}

/** 고정 · 고정 해제 — 메인테이너 */
export async function setNoticePinned(
  id: string,
  pinned: boolean,
): Promise<FormState> {
  await requireMaster();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notices")
    .update({ pinned })
    .eq("id", id);
  if (error) return { error: `바꾸지 못했습니다. (${error.message})` };
  revalidateNotices();
  return { message: pinned ? "맨 위에 고정했습니다." : "고정을 풀었습니다." };
}

/** 공지 지우기 — 본인 글, 메인테이너는 모든 글 */
export async function deleteNotice(id: string): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notices")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return { error: `지우지 못했습니다. (${error.message})` };
  if (!data.length) return { error: "본인 글만 지울 수 있습니다." };
  revalidateNotices();
  return { message: "공지를 지웠습니다." };
}

const revalidateNotice = (noticeId: string) => {
  revalidatePath(`${ROUTES.notices}/${noticeId}`);
  revalidatePath(ROUTES.notices);
};

/** 댓글 달기 — 승인된 계정 누구나 */
export async function addComment(
  noticeId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const body = formText(formData, "body");
  if (!body) return { error: "댓글 내용을 입력해 주세요." };
  if (body.length > 2000) return { error: "댓글은 2000자 이하로 적어 주세요." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("notice_comments")
    .insert({ notice_id: noticeId, body });
  if (error) return { error: `댓글을 달지 못했습니다. (${error.message})` };
  revalidateNotice(noticeId);
  return { message: "댓글을 달았습니다." };
}

/** 댓글 지우기 — 본인 댓글, 메인테이너는 모든 댓글 */
export async function deleteComment(
  id: string,
  noticeId: string,
): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notice_comments")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return { error: `지우지 못했습니다. (${error.message})` };
  if (!data.length) return { error: "본인 댓글만 지울 수 있습니다." };
  revalidateNotice(noticeId);
  return { message: "댓글을 지웠습니다." };
}

/** 반응 누르기 · 취소 — 본인 반응만 */
export async function toggleReaction(
  noticeId: string,
  emoji: string,
  on: boolean,
): Promise<FormState> {
  const me = await requireAdmin();
  if (!(NOTICE_REACTIONS as readonly string[]).includes(emoji))
    return { error: "쓸 수 없는 반응입니다." };
  const supabase = await createClient();
  const { error } = on
    ? await supabase
        .from("notice_reactions")
        .insert({ notice_id: noticeId, emoji })
    : await supabase
        .from("notice_reactions")
        .delete()
        .eq("notice_id", noticeId)
        .eq("user_id", me.id)
        .eq("emoji", emoji);
  if (error && error.code !== "23505")
    return { error: `반응을 바꾸지 못했습니다. (${error.message})` };
  revalidateNotice(noticeId);
  return {};
}
