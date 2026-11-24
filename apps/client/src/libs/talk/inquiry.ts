import "server-only";

import { createHash } from "node:crypto";
import { getServiceSupabase } from "@/libs/supabase/service";
import { recordUsage } from "./usage";

/**
 * 팀에 보내는 문의. 방문자가 화면의 미리보기를 보고 "네, 보내 주세요"라고 답했을 때만 대답 경로(chat)가
 * 부릅니다 — 에이전트가 스스로 보내는 일은 없습니다.
 *
 * Supabase 문의 표(inquiries)에 쌓고, admin 의 Inquiries 에서 메인테이너가 봅니다. (메일 알림은 아직 없음)
 * 저장하지 못하면(키 없음 · 오류) 'fallback' 을 돌려주고, 화면은 같은 내용을 담은 메일 앱 링크를 보입니다.
 */

export const TOPICS = {
  collaboration: ["연구·협력 제안", "Research & collaboration"],
  advisory: ["자문", "Advisory"],
  careers: ["채용·인턴십", "Careers & internships"],
  other: ["기타 문의", "Other"],
} as const;
export type Topic = keyof typeof TOPICS;

export interface Draft {
  topic: Topic;
  message: string;
  name: string;
  email: string;
  organization: string;
}

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function cleanDraft(raw: unknown): Draft | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const pick = (k: string, n: number) =>
    String(r[k] ?? "")
      .slice(0, n)
      .trim();
  const topic = String(r.topic ?? "");
  return {
    topic: topic in TOPICS ? (topic as Topic) : "other",
    message: pick("message", 1200),
    name: pick("name", 80),
    email: pick("email", 120),
    organization: pick("organization", 120),
  };
}

/** 미리보기에 빠진 것 (모델에게 물어보라고 알려 줄 문구) */
export function missingFrom(draft: Draft | null) {
  return [
    !draft?.message && "what the message is about",
    !draft?.name && "their name",
    !EMAIL.test(draft?.email ?? "") && "a valid email address",
  ].filter((v): v is string => Boolean(v));
}

export type DeliverResult = "sent" | "fallback";

/**
 * 문의를 저장합니다. 같은 방문자(sid)의 같은 미리보기는 한 번만 저장됩니다
 * ("✓ 네" 버튼과 말로 한 "네"가 겹쳐도) — 두 번째는 이미 저장된 것으로 보고 'sent'.
 */
export async function deliver(
  draft: Draft,
  lang: "ko" | "en",
  sid: string,
): Promise<DeliverResult> {
  const supabase = getServiceSupabase();
  if (!supabase) return "fallback";
  const key = createHash("sha256")
    .update(`${sid}\n${JSON.stringify(draft)}`)
    .digest("base64url");
  const { error } = await supabase.from("inquiries").insert({
    key,
    topic: draft.topic,
    message: draft.message,
    name: draft.name,
    email: draft.email,
    organization: draft.organization,
    lang,
  });
  if (error && error.code !== "23505") {
    console.error("[talk/inquiry]", error.code, error.message);
    return "fallback";
  }
  if (!error) recordUsage("inquiries");
  return "sent";
}
