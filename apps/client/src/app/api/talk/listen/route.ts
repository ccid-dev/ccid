import { talkEnv } from "@/libs/talk/env";
import { guard, MINUTE } from "@/libs/talk/guard";
import { overDailyLimit, recordUsage } from "@/libs/talk/usage";

/**
 * 방문자가 한 말(한 번의 발화)을 글자로. 브라우저가 말이 끝난 것을 알아채면 그 구간만 16kHz WAV 로 묶어
 * 보냅니다. ElevenLabs Scribe 가 받아 적습니다(예전 실측 약 0.6초). 소리는 받아 적은 뒤 어디에도 남기지 않습니다.
 */

export const maxDuration = 30;

const MAX_BYTES = 1_600_000; // 16kHz 16bit 모노 약 50초

export async function POST(request: Request) {
  const passed = guard(request, "listen", {
    visitor: { limit: 60, windowMs: 10 * MINUTE },
    ip: { limit: 200, windowMs: 10 * MINUTE },
    siteDaily: 3000,
  });
  if (passed instanceof Response) return passed;
  if (talkEnv.fakeListen()) {
    // 개발 서버 연습용: 소리를 받은 척하고 정해 둔 문장을 돌려줍니다.
    await new Promise((r) => setTimeout(r, 500));
    return Response.json({
      text: "cciD는 어떤 연구를 하나요?",
      language: "ko",
    });
  }
  const key = talkEnv.elevenlabs.key();
  // 키가 없거나 하루 한도를 넘으면 503 — 화면은 마이크를 끄고 글로 이어 갑니다.
  if (!key || overDailyLimit("listens"))
    return Response.json({ error: "not configured" }, { status: 503 });

  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof Blob) || !audio.size || audio.size > MAX_BYTES) {
    return Response.json({ error: "bad request" }, { status: 400 });
  }

  recordUsage("listens");
  const body = new FormData();
  body.append("model_id", talkEnv.elevenlabs.sttModel());
  body.append("tag_audio_events", "false");
  body.append("file", audio, "speech.wav");
  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    signal: request.signal,
    headers: { "xi-api-key": key },
    body,
  }).catch(() => null);
  if (!res?.ok) {
    if (res)
      console.error(
        "[talk/listen]",
        res.status,
        (await res.text()).slice(0, 200),
      );
    return Response.json({ error: "listening unavailable" }, { status: 502 });
  }
  const result = (await res.json()) as {
    text?: string;
    language_code?: string;
  };
  return Response.json(
    {
      text: String(result.text ?? "").trim(),
      language: result.language_code ?? "",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
