import "server-only";

import { BOT_UA } from "@/components/agent-blob/talk/humanScore";
import { readPass } from "./pass";

/**
 * /api/talk 문지기. 공개 페이지에서 부르는 경로라 누구나 두드릴 수 있어 여러 겹으로 막습니다.
 * 1) 다른 사이트의 페이지가 우리 키로 말하게 하지 못하도록, 브라우저가 붙이는 Origin 이 이 사이트가 아니면 거절
 * 2) 크롤러 · AI 에이전트의 User-Agent 거절
 * 3) 사람 확인 통행증(pass.ts) 요구
 * 4) 횟수 한도: 통행증(방문자)마다 · IP 마다(넉넉하게) · 사이트 전체 하루
 *
 * 횟수는 서버 메모리에 셉니다. 서버(인스턴스)마다 따로 세고 다시 켜지면 비는 느슨한 한도라,
 * 비용 폭주를 막는 안전띠일 뿐 정확한 계량은 아닙니다. 마지막 안전장치는 OpenAI · ElevenLabs 계정의
 * 월 예산 한도입니다. (사이트 전체 하루 한도는 4단계에서 Supabase 로 옮겨 정확하게 셉니다)
 */

export const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

interface Window {
  limit: number;
  windowMs: number;
}

const buckets = new Map<string, { start: number; count: number }>();

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded
      ? (forwarded.split(",")[0] ?? "")
      : (request.headers.get("x-real-ip") ?? "local")
  ).trim();
}

function sameSite(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

/** 시간 창 안에서 한 번 더 써도 되면 true (쓴 것으로 셉니다) */
function take(key: string, { limit, windowMs }: Window) {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (now - b.start > DAY) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.start > windowMs) {
    buckets.set(key, { start: now, count: 1 });
    return true;
  }
  return ++bucket.count <= limit;
}

export interface Limits {
  /** 방문자(통행증) 한 명이 이 시간 창 안에 쓸 수 있는 횟수 */
  visitor: Window;
  /** 같은 IP 전체 (여러 사람이 같이 쓰므로 넉넉하게) */
  ip: Window;
  /** 사이트 전체 하루 */
  siteDaily: number;
}

const json = (error: string, status: number) =>
  Response.json({ error }, { status });

/**
 * 통과하면 { sid }, 막히면 바로 돌려줄 Response.
 * pass: false 는 통행증을 주는 경로(/api/talk/pass) 자체에서 씁니다.
 */
export function guard(
  request: Request,
  name: string,
  limits: Limits,
  { pass = true }: { pass?: boolean } = {},
): { sid: string | null } | Response {
  if (!sameSite(request)) return json("forbidden", 403);
  if (BOT_UA.test(request.headers.get("user-agent") ?? ""))
    return json("forbidden", 403);
  const sid = readPass(request);
  if (pass && !sid) return json("pass", 403);
  if (sid && !take(`${name}:v:${sid}`, limits.visitor))
    return json("busy", 429);
  if (!take(`${name}:ip:${clientIp(request)}`, limits.ip))
    return json("busy", 429);
  if (!take(`${name}:site`, { limit: limits.siteDaily, windowMs: DAY }))
    return json("closed", 429);
  return { sid };
}

/** 문의 보내기처럼 한 방문자에게 더 좁은 한도가 필요할 때 (쓴 것으로 셉니다) */
export function allowOnce(name: string, who: string, window: Window) {
  return take(`${name}:${who}`, window);
}
