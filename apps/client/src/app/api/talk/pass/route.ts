import { scoreHuman } from "@/components/agent-blob/talk/humanScore";
import { guard, MINUTE } from "@/libs/talk/guard";
import { issuePass } from "@/libs/talk/pass";

/**
 * 대화 통행증을 줍니다. 브라우저가 보낸 입력 요약(숫자뿐)을 브라우저와 같은 함수로 다시 판정합니다.
 * 사람으로 보이지 않으면 주지 않습니다 — 그러면 에이전트는 메일 주소를 안내하고 대화를 시작하지 않습니다.
 */
export async function POST(request: Request) {
  const passed = guard(
    request,
    "pass",
    {
      visitor: { limit: 1, windowMs: MINUTE },
      ip: { limit: 30, windowMs: 10 * MINUTE },
      siteDaily: 2000,
    },
    { pass: false },
  );
  if (passed instanceof Response) return passed;
  const summary = await request.json().catch(() => null);
  const verdict = scoreHuman(
    summary ?? {},
    request.headers.get("user-agent") ?? "",
  );
  if (!verdict.human)
    return Response.json({ error: "unavailable" }, { status: 403 });
  return Response.json(issuePass(), {
    headers: { "Cache-Control": "no-store" },
  });
}
