import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { talkEnv } from "./env";

/**
 * 대화 통행증. 브라우저가 "사람으로 보인다"는 요약을 보내면(/api/talk/pass) 30분짜리 서명을 줍니다.
 * 대답 · 목소리 · 받아 적기 경로는 이 서명이 있어야 일합니다 — 사이트를 거치지 않고 경로만 두드리는
 * 자동화는 여기서 걸립니다.
 *
 * 통행증마다 무작위 번호(sid)가 들어 있어, 횟수 한도를 IP 가 아니라 방문자(통행증)마다 셉니다.
 * 학교 · 회사처럼 여러 사람이 IP 하나를 같이 쓰는 곳에서도 서로 한도를 나눠 쓰지 않습니다.
 *
 * 서명 키: TALK_PASS_SECRET 에서 이 용도의 키를 따로 뽑아 씁니다. 없으면(로컬) 서버를 켤 때마다
 * 새로 만듭니다 — 서버를 다시 켜면 통행증도 새로 받습니다.
 */

export const PASS_HEADER = "x-talk-pass";
const TTL = 30 * 60_000;

let fallbackSecret: string | null = null;
let derived: Buffer | null = null;
const key = () =>
  (derived ??= createHmac(
    "sha256",
    talkEnv.passSecret() ||
      (fallbackSecret ??= randomBytes(32).toString("hex")),
  )
    .update("ccid talk pass v1")
    .digest());
const mac = (body: string) =>
  createHmac("sha256", key()).update(body).digest("base64url");

export function issuePass() {
  const exp = Date.now() + TTL;
  const sid = randomBytes(9).toString("base64url");
  const body = Buffer.from(JSON.stringify({ exp, sid })).toString("base64url");
  return { token: `${body}.${mac(body)}`, exp };
}

/** 맞는 통행증이면 그 방문자 번호(sid), 아니면 null */
export function readPass(request: Request): string | null {
  const [body, sig] = (request.headers.get(PASS_HEADER) ?? "").split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(mac(body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given))
    return null;
  try {
    const { exp, sid } = JSON.parse(
      Buffer.from(body, "base64url").toString(),
    ) as { exp: number; sid: string };
    return exp > Date.now() && sid ? sid : null;
  } catch {
    return null;
  }
}
