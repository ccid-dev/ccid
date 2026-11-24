import { APP_INFO } from "@/config";
import { talkEnv } from "@/libs/talk/env";
import { guard, MINUTE } from "@/libs/talk/guard";
import { overDailyLimit, recordUsage } from "@/libs/talk/usage";

/**
 * 대답 한 문장을 cciD 목소리로. ElevenLabs 의 스트리밍(글자별 시각 포함)을 그대로 흘려 줍니다.
 * 한 줄에 하나씩 JSON 이 오고, 소리는 audio_base64 의 24kHz 16bit 모노 PCM 입니다. 브라우저가 Web Audio 로
 * 조각마다 이어 틀고, 방문자가 말을 끊으면 음량을 줄이며 멈출 수 있게 압축하지 않은 소리로 받습니다.
 * 글자별 시각(alignment)으로 화면의 글자를 목소리에 맞춰 드러내고, 끊겼을 때 어디까지 들렸는지 압니다.
 *
 * 목소리 ID 는 예전 사이트에서 고른 것입니다(비밀값 아님). ELEVENLABS_API_KEY 가 그 목소리를 만든 계정의 키여야 합니다.
 * 모델은 eleven_multilingual_v2 가 기본(시작까지 약 1초). 더 빠른 모델은 ELEVENLABS_TTS_MODEL 로 바꿉니다.
 */

export const maxDuration = 30;

const VOICES = { ko: "KYwimsWr2vcADJr19cfe", en: "mm43BCm0W4mWaXPWB3Ox" };

// 화면에는 cciD 로 두고, 소리로만 읽는 법을 정합니다 — 쉼 없이 한 단어처럼. 메일 주소도 사람이 부르듯이.
function forSpeech(text: string, lang: "ko" | "en") {
  const email = new RegExp(APP_INFO.email.replace(/[.@]/g, "\\$&"), "gi");
  return text
    .replace(
      email,
      lang === "ko"
        ? "헬로 점 씨씨아이디 골뱅이 지메일 닷컴"
        : "hello dot C-C-I-D at gmail dot com",
    )
    .replace(/\bcciD\b/gi, lang === "ko" ? "씨씨아이디" : "C-C-I-D");
}

export async function POST(request: Request) {
  const passed = guard(request, "speak", {
    visitor: { limit: 120, windowMs: 10 * MINUTE },
    ip: { limit: 400, windowMs: 10 * MINUTE },
    siteDaily: 6000,
  });
  if (passed instanceof Response) return passed;
  const key = talkEnv.elevenlabs.key();
  // 키가 없거나 하루 한도를 넘으면 503 — 화면은 그 문장을 글자로만 보여 줍니다.
  if (!key || overDailyLimit("speak_chars"))
    return Response.json({ error: "not configured" }, { status: 503 });

  let payload: {
    lang?: unknown;
    text?: unknown;
    previous?: unknown;
    next?: unknown;
  };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const lang = payload.lang === "en" ? "en" : "ko";
  const text = String(payload.text ?? "")
    .trim()
    .slice(0, 600);
  if (!text) return Response.json({ error: "bad request" }, { status: 400 });
  const context = (v: unknown) => forSpeech(String(v ?? "").slice(-300), lang);

  recordUsage("speaks");
  recordUsage("speak_chars", text.length);
  const model = talkEnv.elevenlabs.ttsModel();
  const upstream = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICES[lang]}/stream/with-timestamps?output_format=pcm_24000`,
    {
      method: "POST",
      signal: request.signal,
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: forSpeech(text, lang),
        model_id: model,
        // 앞뒤 문장을 알려 주면 문장마다 따로 만들어도 억양이 이어집니다.
        ...(payload.previous
          ? { previous_text: context(payload.previous) }
          : {}),
        ...(payload.next ? { next_text: context(payload.next) } : {}),
        ...(model.endsWith("v2_5") && { language_code: lang }),
        voice_settings: { stability: 0.5, similarity_boost: 0.8, speed: 1.0 },
      }),
    },
  ).catch(() => null);
  if (!upstream?.ok) {
    if (upstream)
      console.error(
        "[talk/speak]",
        upstream.status,
        (await upstream.text()).slice(0, 200),
      );
    return Response.json({ error: "voice unavailable" }, { status: 502 });
  }
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
