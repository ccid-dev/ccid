import "server-only";

import { after } from "next/server";
import { getServiceSupabase } from "@/libs/supabase/service";

/**
 * 사이트 전체 하루 사용량 (Supabase talk_usage, 한국 시간 날짜별). 서버가 여러 대여도 한 곳에서 셉니다.
 * 한도를 넘으면 에이전트는 모델 · 목소리를 부르지 않고 "메일로 문의해 주세요"만 말합니다.
 * → 비용이 하루 이 이상 나가지 않는 마지막 안전장치. (계정 월 예산 한도도 함께 걸어 두세요)
 *
 * 속도를 위해 요청마다 DB 를 기다리지 않습니다: 마지막으로 센 값(이 서버 메모리)으로 한도를 보고,
 * 세기는 응답을 보낸 뒤(after) 합니다. 그래서 몇 건 정도는 한도를 넘을 수 있습니다.
 * SUPABASE_SECRET_KEY 가 없으면(로컬 등) 세지 않고, guard.ts 의 서버 메모리 한도만 씁니다.
 */

export type UsageKind =
  "chats" | "listens" | "speaks" | "speak_chars" | "inquiries";

const num = (value: string | undefined, fallback: number) => {
  const n = Number((value ?? "").trim());
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/** 하루 한도. env 로 바꿀 수 있습니다 (비우면 기본값). */
const LIMITS: Partial<Record<UsageKind, () => number>> = {
  /** 대답 요청 (OpenAI) */
  chats: () => num(process.env.TALK_DAILY_CHATS, 1000),
  /** 받아 적기 요청 (ElevenLabs) */
  listens: () => num(process.env.TALK_DAILY_LISTENS, 1500),
  /** 목소리로 읽는 글자 수 (ElevenLabs 과금 기준) */
  speak_chars: () => num(process.env.TALK_DAILY_SPEAK_CHARS, 30000),
};

const today = () =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });

/** 이 서버가 마지막으로 본 오늘 값 */
const seen: { day: string; counts: Partial<Record<UsageKind, number>> } = {
  day: "",
  counts: {},
};

/** 오늘 이 항목이 한도를 넘었는지 (마지막으로 센 값 기준) */
export function overDailyLimit(kind: UsageKind) {
  const limit = LIMITS[kind]?.();
  if (!limit || seen.day !== today()) return false;
  return (seen.counts[kind] ?? 0) >= limit;
}

/** 응답을 보낸 뒤 오늘 사용량을 올립니다. */
export function recordUsage(kind: UsageKind, amount = 1) {
  const supabase = getServiceSupabase();
  if (!supabase || amount <= 0) return;
  after(async () => {
    const { data, error } = await supabase.rpc("talk_usage_bump", {
      kind,
      amount,
    });
    if (error) {
      console.error("[talk/usage]", error.message);
      return;
    }
    const day = today();
    if (seen.day !== day) {
      seen.day = day;
      seen.counts = {};
    }
    seen.counts[kind] = data;
  });
}
