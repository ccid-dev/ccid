import { APP_INFO } from "@/config";
import { isDev, talkEnv } from "@/libs/talk/env";
import { allowOnce, guard, MINUTE } from "@/libs/talk/guard";
import {
  cleanDraft,
  type DeliverResult,
  deliver,
  type Draft,
  missingFrom,
} from "@/libs/talk/inquiry";
import { INQUIRY_TOOL, SEND_TOOL, systemPrompt } from "@/libs/talk/prompt";
import { overDailyLimit, recordUsage } from "@/libs/talk/usage";

/**
 * 에이전트의 대답. 방문자의 말(글자)을 받아 OpenAI 로 대답을 만들고, 만들어지는 대로 한 줄씩 흘려보냅니다(NDJSON).
 * 브라우저는 문장이 끝날 때마다 바로 목소리로 바꿔 틀기 시작합니다.
 *   {"t":"text","d":"..."}    대답의 조각
 *   {"t":"draft","draft":{}}  팀에 보낼 메시지의 미리보기(읽기 전용) — 에이전트가 "보낼까요?" 하고 묻습니다
 *   {"t":"sent"} / {"t":"fallback"}  보냈다 / 여기서 못 보내 메일 앱 링크를 보인다
 *   {"t":"ended"}  대화 길이 한도 — 더 받지 않습니다
 *   {"t":"done"} / {"t":"error"}
 *
 * 서버는 대화를 기억하지 않습니다. 브라우저가 대화 기록을 매번 통째로 보내고, 서버에는 토큰 수만 남깁니다.
 * 지연이 곧 자연스러움이라 빠른 설정을 기본으로 둡니다(env.ts). 예전 사이트 실측: 첫 글자까지 약 0.6초.
 */

// 대답이 멈춰도 오래 붙잡지 않습니다 (Vercel 무료 계정 최대 300초)
export const maxDuration = 60;

type Lang = "ko" | "en";
interface Message {
  role: "user" | "assistant";
  content: string;
}
interface ToolCall {
  id: string;
  name: string;
  args: string;
}
type Event = Record<string, unknown> & { t: string };

const MAX_TURNS = 24;
const MAX_CHARS = 1200;

/** 같은 방문자 · 같은 IP · 사이트 전체 한도 */
const LIMITS = {
  visitor: { limit: 40, windowMs: 10 * MINUTE },
  ip: { limit: 120, windowMs: 10 * MINUTE },
  siteDaily: 1500,
};

// 보내기 앞뒤의 한마디는 정해 둡니다 — 모델에게 맡기면 보내지 않은 것을 보냈다고 하거나 묻지 않고 넘어갈 수 있습니다.
const LINES: Record<Lang, Record<"confirm" | DeliverResult, string>> = {
  ko: {
    confirm: "이렇게 전할게요. 화면에서 이메일 주소가 맞는지 보시고, 보낼까요?",
    sent: "보냈어요. 팀에서 곧 답장을 드릴 거예요.",
    fallback:
      "지금은 여기서 바로 보낼 수 없어요. 화면의 링크를 누르면 같은 내용으로 메일 앱이 열려요.",
  },
  en: {
    confirm:
      "Here’s what I’ll send. Check that your email is right on screen. Shall I send it?",
    sent: "Sent. The team will get back to you soon.",
    fallback:
      "I can’t send it from here right now. The link on screen opens your mail app with the same message.",
  },
};
const isKorean = (s: string) => /[가-힣]/.test(s);
const linesFor = (draft: Draft) => LINES[isKorean(draft.message) ? "ko" : "en"];

// 한 대화의 길이. 비용은 대답 수(특히 목소리)에 비례하고, 메시지를 천천히 쓰는 사람을 시간으로 끊으면 안 되니
// 방문자의 말 수로 셉니다. 길어지면 정리를 권하고(wrapUp), 다음엔 새 질문을 받지 않되 팀에 보내는 길은
// 열어 두고(last), 마지막엔 모델을 부르지 않고 닫습니다(end). 미리보기가 떠 있으면 몇 번 더 기다립니다(grace).
const TURNS = { wrapUp: 12, last: 18, end: 24, grace: 4 };
const NOTES = {
  wrapUp:
    "This conversation is getting long. Keep replies brief, and when it fits, offer to pass anything else to the team as one message.",
  last: `This conversation is near its limit. Answer in one short sentence if the answer is below, then say that anything more is best taken up with the team, by a message from here or at ${APP_INFO.email}. Don’t open new topics. If they want to send a message, help them finish; that path stays open.`,
};
// 사이트 전체 하루 한도(usage.ts)를 넘었을 때 — 모델을 부르지 않고 이 말만 합니다.
const CLOSED: Record<Lang, string> = {
  ko: `오늘은 대화가 많아 여기까지만 이야기할 수 있어요. ${APP_INFO.email} 으로 보내 주시면 팀이 답해 드려요.`,
  en: `It’s been a busy day, so I can’t talk more today. Write to ${APP_INFO.email} and the team will get back to you.`,
};
const ENDED: Record<Lang, string> = {
  ko: `오늘은 여기까지 이야기할게요. 더 나누고 싶은 이야기는 ${APP_INFO.email} 으로 편하게 보내 주세요.`,
  en: `Let’s leave it here for today. If there’s more to share, write to ${APP_INFO.email} anytime.`,
};

function cleanHistory(messages: unknown): Message[] | null {
  if (!Array.isArray(messages)) return null;
  const turns = messages
    .slice(-MAX_TURNS)
    .map((m: { role?: unknown; content?: unknown } | null) => ({
      role:
        m?.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: String(m?.content ?? "")
        .slice(0, MAX_CHARS)
        .trim(),
    }))
    .filter((m) => m.content);
  return turns.at(-1)?.role === "user" ? turns : null;
}

function openai(body: Record<string, unknown>, signal: AbortSignal) {
  const tier = talkEnv.openai.tier();
  const reasoning = talkEnv.openai.reasoning();
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${talkEnv.openai.key()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: talkEnv.openai.model(),
      stream: true,
      stream_options: { include_usage: true },
      max_completion_tokens: 400,
      temperature: 0.3, // 사실을 말하는 안내자 — 표현은 자연스럽되 지어내지 않게 낮춥니다
      ...(reasoning !== "default" && { reasoning_effort: reasoning }),
      ...(tier !== "default" && { service_tier: tier }),
      ...body,
    }),
  });
}

interface Chunk {
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    prompt_tokens_details?: { cached_tokens?: number };
  };
  choices?: {
    delta?: {
      content?: string;
      tool_calls?: {
        index: number;
        id?: string;
        function?: { name?: string; arguments?: string };
      }[];
    };
  }[];
}

/** OpenAI 의 스트림을 읽으며 글자는 바로 내보내고, 도구 호출은 다 모일 때까지 모읍니다. */
async function relay(res: Response, send: (e: Event) => void) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  const calls: ToolCall[] = [];
  let buffer = "";
  let text = "";
  let usage: Chunk["usage"] | null = null;
  let ended = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let cut: number;
    while ((cut = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, cut).trim();
      buffer = buffer.slice(cut + 1);
      if (!line.startsWith("data:") || line === "data: [DONE]") continue;
      const chunk = JSON.parse(line.slice(5)) as Chunk;
      if (chunk.usage) usage = chunk.usage;
      const delta = chunk.choices?.[0]?.delta;
      // 도구가 걸려 있으면 모델이 한 문단을 말한 뒤 줄을 바꿔 같은 말을 고쳐 다시 하곤 합니다(예전 실측, 8번에 5번).
      // 대답은 소리로 나가는 한 문단이므로 첫 줄바꿈에서 말을 끊습니다. 도구 호출은 계속 받습니다.
      if (delta?.content && !ended) {
        const piece = text ? delta.content : delta.content.replace(/^\s+/, "");
        const nl = piece.indexOf("\n");
        const keep = nl < 0 ? piece : piece.slice(0, nl);
        if (keep) {
          text += keep;
          send({ t: "text", d: keep });
        }
        if (nl >= 0 && text.trim()) ended = true;
      }
      for (const call of delta?.tool_calls ?? []) {
        const slot = (calls[call.index] ??= { id: "", name: "", args: "" });
        slot.id ||= call.id ?? "";
        slot.name ||= call.function?.name ?? "";
        slot.args += call.function?.arguments ?? "";
      }
    }
  }
  // 비용을 지켜볼 수 있게 토큰 수만 남깁니다(대화 내용은 남기지 않습니다). 개발 서버에서는 응답에도 실어 보냅니다.
  if (usage && isDev)
    send({
      t: "usage",
      in: usage.prompt_tokens,
      cached: usage.prompt_tokens_details?.cached_tokens ?? 0,
      out: usage.completion_tokens,
    });
  if (usage)
    console.info(
      "[talk/chat] tokens in",
      usage.prompt_tokens,
      "cached",
      usage.prompt_tokens_details?.cached_tokens ?? 0,
      "out",
      usage.completion_tokens,
    );
  return { text, calls };
}

/** 개발 서버 연습용 대답: OpenAI 를 부르지 않고 단어 단위로 흘려보냅니다. */
async function fakeReply(
  history: Message[],
  lang: Lang,
  send: (e: Event) => void,
) {
  const last = history.at(-1)?.content ?? "";
  const reply =
    lang === "ko" || isKorean(last)
      ? `연습용 대답이에요. "${last.slice(0, 30)}"라고 하셨네요. 실제 대답은 OpenAI 키를 넣으면 나와요.`
      : `This is a practice reply. You said "${last.slice(0, 30)}". Real replies need the OpenAI key.`;
  await new Promise((r) => setTimeout(r, 500));
  for (const word of reply.split(/(?<= )/)) {
    send({ t: "text", d: word });
    await new Promise((r) => setTimeout(r, 40));
  }
}

export async function POST(request: Request) {
  const passed = guard(request, "chat", LIMITS);
  if (passed instanceof Response) return passed;
  const fake = talkEnv.fake();
  if (!fake && !talkEnv.openai.key())
    return Response.json({ error: "not configured" }, { status: 503 });

  let payload: {
    messages?: unknown;
    lang?: unknown;
    draft?: unknown;
    confirm?: unknown;
  };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const history = cleanHistory(payload.messages);
  if (!history) return Response.json({ error: "bad request" }, { status: 400 });
  const lang: Lang = payload.lang === "en" ? "en" : "ko";
  const draft = cleanDraft(payload.draft);
  const visitorTurns = (payload.messages as { role?: unknown }[]).filter(
    (m) => m?.role !== "assistant",
  ).length;
  const talkLang: Lang = isKorean(history.at(-1)?.content ?? "") ? "ko" : lang;
  const ended = visitorTurns >= TURNS.end + (draft ? TURNS.grace : 0);
  const who = passed.sid ?? "anon";
  const send_ = async (d: Draft) =>
    allowOnce("send", who, { limit: 4, windowMs: 60 * MINUTE })
      ? deliver(d, lang, who)
      : ("fallback" as const);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      // 방문자가 말을 끊으면 브라우저가 요청을 닫습니다 — 그 뒤로는 보낼 곳이 없습니다.
      const send = (e: Event) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
        } catch {
          /* 닫힘 */
        }
      };
      try {
        // 미리보기 아래의 "✓ 네"를 눌렀다 — 모델을 거치지 않고 그 미리보기를 보냅니다.
        if (
          payload.confirm === true &&
          draft &&
          missingFrom(draft).length === 0
        ) {
          const result = await send_(draft);
          send({ t: result });
          send({ t: "text", d: linesFor(draft)[result] });
          send({ t: "done" });
          return;
        }
        if (ended) {
          send({ t: "text", d: ENDED[talkLang] });
          send({ t: "ended" });
          send({ t: "done" });
          return;
        }
        if (overDailyLimit("chats")) {
          send({ t: "text", d: CLOSED[talkLang] });
          send({ t: "done" });
          return;
        }
        if (!fake) recordUsage("chats");
        if (fake) {
          await fakeReply(history, lang, send);
          send({ t: "done" });
          return;
        }

        const messages: Record<string, unknown>[] = [
          { role: "system", content: await systemPrompt(lang) },
          ...history,
        ];
        // 안내는 마지막 말 바로 앞에 끼웁니다 (앞부분이 그대로라 프롬프트 캐시가 깨지지 않습니다)
        const note = (content: string) =>
          messages.splice(messages.length - 1, 0, { role: "system", content });
        if (draft) {
          // 화면에 떠 있는 미리보기를 알려 줍니다 — "네"나 "이메일만 바꿔 주세요" 같은 말을 알아듣도록.
          note(
            `Preview on the visitor’s screen, waiting for their answer to "send it?" (not sent): ${JSON.stringify(draft)}`,
          );
        }
        if (visitorTurns >= TURNS.last) note(NOTES.last);
        else if (visitorTurns >= TURNS.wrapUp) note(NOTES.wrapUp);

        const first = await openai(
          {
            messages,
            tools: [INQUIRY_TOOL, SEND_TOOL],
            tool_choice: "auto",
            parallel_tool_calls: false,
          },
          request.signal,
        );
        if (!first.ok) {
          console.error(
            "[talk/chat] openai",
            first.status,
            (await first.text()).slice(0, 300),
          );
          throw new Error(`openai ${first.status}`);
        }
        const { text, calls } = await relay(first, send);

        // 도구를 부르기 전에 이미 말을 했으면 정해 둔 한마디만 잇습니다.
        // 한 번 더 부르면 같은 말을 되풀이했습니다(예전 실측).
        const lead = text.trim() ? " " : "";
        const ask = async (call: ToolCall, result: string) => {
          if (text.trim()) return;
          const second = await openai(
            {
              messages: [
                ...messages,
                {
                  role: "assistant",
                  content: null,
                  tool_calls: [
                    {
                      id: call.id,
                      type: "function",
                      function: { name: call.name, arguments: call.args },
                    },
                  ],
                },
                { role: "tool", tool_call_id: call.id, content: result },
              ],
            },
            request.signal,
          );
          if (!second.ok) throw new Error(`openai ${second.status}`);
          await relay(second, send);
        };

        const call = calls.find(
          (c) => c?.name === "draft_inquiry" || c?.name === "send_inquiry",
        );
        if (call?.name === "draft_inquiry") {
          // 모델이 이름 · 이메일을 받기 전에 미리보기를 부르기도 합니다(예전 실측). 빠진 것이 있으면 띄우지 않고 물어보게 합니다.
          let args: unknown = {};
          try {
            args = JSON.parse(call.args || "{}");
          } catch {
            /* 빈 초안으로 취급 */
          }
          const shown = cleanDraft(args)!;
          const missing = missingFrom(shown);
          if (missing.length === 0) {
            send({ t: "draft", draft: shown });
            send({ t: "text", d: lead + linesFor(shown).confirm });
          } else {
            await ask(
              call,
              `Not shown. Still missing: ${missing.join(", ")}. Ask for what's missing naturally, in one sentence.`,
            );
          }
        } else if (call?.name === "send_inquiry") {
          // 화면에 미리보기가 떠 있어야만 보냅니다. 보내는 것은 그 미리보기 그대로입니다.
          if (draft && missingFrom(draft).length === 0) {
            const result = await send_(draft);
            send({ t: result });
            send({ t: "text", d: lead + linesFor(draft)[result] });
          } else {
            await ask(
              call,
              "Nothing was sent: there is no complete preview on screen. Collect what is missing and call draft_inquiry first.",
            );
          }
        }
        send({ t: "done" });
      } catch (error) {
        if (!request.signal.aborted) {
          console.error("[talk/chat]", String(error));
          send({ t: "error" });
        }
      } finally {
        try {
          controller.close();
        } catch {
          /* 닫힘 */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
