// 에이전트 대화 흐름. React 바깥의 평범한 클래스이고, 바뀐 것은 subscribe 로 알립니다(AgentBlob 이 구독).
//
// 한 번의 차례:
//   (목소리) 방문자의 말 → 음성 감지가 말의 끝을 앎 → /api/talk/listen 으로 받아 적기 ┐
//   (글)     입력 줄에 쓴 말 ─────────────────────────────────────────────────────────┴→
//   → /api/talk/chat 이 대답을 흘려보냄 → 문장이 끝날 때마다
//     (목소리) /api/talk/speak → 이어서 틀고, 들리는 만큼 글자를 드러냄
//     (글)     바로 한 줄씩 보여 줌
// 목소리로 대답하는 것은 마이크를 켰을 때(voice)만입니다 — 글로 대화하면 ElevenLabs 를 부르지 않습니다.
//
// 사람처럼 느껴지게 하는 것들 (예전 사이트, ChatGPT 음성 모드 참고):
//   · 끼어들기: 에이전트가 말하는 중에 방문자가 말을 시작하면 소리를 먼저 낮추고(덕킹), 진짜 말이면
//     0.4초에 걸쳐 줄이며 멈춥니다. 어디까지 들렸는지 기록에 남깁니다(그 뒤는 듣지 못한 것으로).
//   · 맞장구: 방문자가 길게 말하다 잠깐 쉴 때 "네~" 같은 짧은 소리를 가끔 냅니다.
//   · 생각 소리: 대답이 늦어지면 "음~" 을 한 번. 바로 앞에서 맞장구를 쳤으면 내지 않습니다.
//   · 이어 말하기: 대답이 나오기 전에 방문자가 다시 말을 시작하면, 앞의 말과 합쳐 한 번으로 묻습니다.
//
// 대화는 이 객체(브라우저 메모리)에만 있습니다. 대화 창이 공통 레이아웃에 있어 페이지를 옮겨도 이어지고,
// 새로고침하면 사라집니다. 저장소(localStorage · DB)에는 남기지 않습니다.
// 서버는 대화를 기억하지 않아서, 대화 기록(history)을 매번 통째로 보냅니다.

import { APP_INFO } from "@/config";
import { answerById, SUGGESTIONS } from "./answers";
import GREETING from "./greeting.json";
import { talkPass } from "./human";
import {
  AudioOut,
  type Mic,
  pcmFromBase64,
  revealTo,
  SAMPLE_RATE,
  startMic,
  TUNE,
  wav,
} from "./voice";

export type TalkLang = "ko" | "en";
/** listening = 마이크가 켜져 기다리는 중, hearing = 방문자가 말하는 중 */
export type TalkPhase =
  "idle" | "listening" | "hearing" | "thinking" | "speaking";
/** 입력 줄 아래 잠깐 보이는 안내 */
export type TalkNotice = "micBlocked" | "noVoice" | "voiceFailed" | "quiet";

export interface TalkDraft {
  topic: string;
  message: string;
  name: string;
  email: string;
  organization: string;
}

/** 화면에 쌓이는 대화 한 칸 */
export type TalkTurn =
  | { id: number; role: "user"; text: string }
  /**
   * 에이전트의 대답 (문장 단위 줄). notice = 오류 · 바쁨 안내.
   * synced = 목소리에 맞춰 글자가 드러나는 중 (단어가 차례로 늦게 떠오르는 애니메이션을 쓰지 않음)
   */
  | {
      id: number;
      role: "agent";
      lines: string[];
      notice?: boolean;
      synced?: boolean;
    }
  /** 팀에 보낼 메시지 미리보기 */
  | {
      id: number;
      role: "draft";
      draft: TalkDraft;
      status: "pending" | "sent" | "fallback";
    };

export interface TalkView {
  phase: TalkPhase;
  turns: TalkTurn[];
  /** 지금 말하고 있는(막 나타난) 대답 칸. 이 칸만 단어가 떠오르는 애니메이션을 합니다. */
  liveId: number | null;
  /** 이미 고른 추천 질문 (다시 보여 주지 않음) */
  asked: number[];
  /** 마이크가 켜져 목소리로 대화 중 */
  voice: boolean;
  /** 마이크를 켜는 중 (브라우저 허용 · 음성 감지 불러오기) */
  starting: boolean;
  notice: TalkNotice | null;
  /** 대화 길이 한도에 닿아 더 받지 않음 */
  ended: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

/** 목소리로 나가는 대답의 한 문장 */
interface Part {
  text: string;
  /** 소리가 시작 · 끝나는 시각 (ctx 시간) */
  start: number;
  end: number;
  /** 글자별 시작 시각 (ElevenLabs alignment) */
  times: number[] | null;
  /** 받은 소리 길이 (초) */
  audio: number;
  /** 목소리를 못 받음 — 글자만 보여 줌 */
  failed: boolean;
}

/** 지금 대답 중인 차례 */
interface Current {
  ctrl: AbortController;
  turnId: number | null;
  /** 글: 보여 준 문장들 */
  lines: string[];
  /** 목소리: 문장마다 소리 */
  voiced: boolean;
  parts: Part[];
  sources: AudioBufferSourceNode[];
  gain: GainNode | null;
  /** 다음 소리를 이어 붙일 시각 (ctx 시간) */
  cursor: number;
  started: boolean;
}

const isKorean = (s: string) => /[가-힣]/.test(s);

const COPY = {
  ko: {
    busy: "질문이 많아 잠시 쉬어야 해요. 몇 분 뒤에 다시 물어봐 주세요.",
    failed: `지금은 대답을 만들지 못했어요. 다시 물어봐 주시거나 ${APP_INFO.email} 으로 보내 주세요.`,
    // 사람 확인을 통과하지 못했을 때. 탓하는 말 없이, 사람에게도 AI 에이전트에게도 쓸모 있는 길(메일)을 줍니다.
    unavailable: `여기서는 지금 대화를 시작할 수 없어요. ${APP_INFO.email} 으로 보내 주시면 팀이 답해 드려요.`,
    yes: "네",
  },
  en: {
    busy: "That’s a lot of questions at once. Try again in a few minutes.",
    failed: `I couldn’t answer just now. Ask again, or write to ${APP_INFO.email}.`,
    unavailable: `A conversation can’t start here right now. Write to ${APP_INFO.email} and the team will get back to you.`,
    yes: "Yes",
  },
};

/** 흘러오는 글을 문장 단위로 끊습니다. 문장이 끝나는 대로 목소리를 만들기 시작해야 빨리 들립니다. */
function sentences(onSentence: (s: string) => void) {
  let buf = "";
  return {
    push(d: string) {
      buf += d;
      let m: RegExpMatchArray | null;
      while ((m = buf.match(/^([\s\S]*?[.!?。…]+["'”’)]?)\s+/))) {
        if (m[1]?.trim()) onSentence(m[1].trim());
        buf = buf.slice(m[0].length);
      }
    },
    flush() {
      if (buf.trim()) onSentence(buf.trim());
      buf = "";
    },
  };
}

/** 정해 둔 글 → 문장 줄 */
function toLines(text: string) {
  const out: string[] = [];
  const split = sentences((s) => out.push(s));
  for (const part of text.split("\n")) {
    split.push(part);
    split.flush();
  }
  return out;
}

/** 글로 대답이 끝난 뒤 구가 말하는 모습을 조금 더 이어 가는 시간 (단어가 다 떠오를 때까지) */
const SPEAK_TAIL_MS = 900;
/** 안내 문구가 보이는 시간 */
const NOTICE_MS = 4000;

export class TalkChat {
  private lang: TalkLang;
  private history: Message[] = [];
  private listeners = new Set<() => void>();
  private current: Current | null = null;
  private tail: ReturnType<typeof setTimeout> | null = null;
  private noticeTimer: ReturnType<typeof setTimeout> | null = null;
  private greeted = false;
  private seq = 0;
  // 목소리
  private audio: AudioOut | null = null;
  private mic: Mic | null = null;
  private level = 0;
  private prefix = "";
  private listenSeq = 0;
  private thinkTimer: ReturnType<typeof setTimeout> | null = null;
  private thinkEnd = 0;
  private quietTimer: ReturnType<typeof setTimeout> | null = null;
  private lastNodAt = 0;
  private lastFrameAt = 0;
  private speech = { on: false, ms: 0, quietMs: 0 };
  private view: TalkView = {
    phase: "idle",
    turns: [],
    liveId: null,
    asked: [],
    voice: false,
    starting: false,
    notice: null,
    ended: false,
  };

  constructor(lang: TalkLang) {
    this.lang = lang;
  }

  // ── useSyncExternalStore 용 ──
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getSnapshot = () => this.view;

  private set(patch: Partial<TalkView>) {
    this.view = { ...this.view, ...patch };
    if ("phase" in patch) this.mic?.setBarge(this.view.phase === "speaking");
    for (const fn of this.listeners) fn();
  }

  private add(turn: TalkTurn) {
    this.set({ turns: [...this.view.turns, turn] });
  }

  private update(id: number, patch: Partial<TalkTurn>) {
    this.set({
      turns: this.view.turns.map((t) =>
        t.id === id ? ({ ...t, ...patch } as TalkTurn) : t,
      ),
    });
  }

  private remove(id: number | null) {
    if (id === null) return;
    this.set({ turns: this.view.turns.filter((t) => t.id !== id) });
  }

  /** 화면에 떠 있는, 아직 답을 기다리는 미리보기 */
  private pendingDraft() {
    const turn = [...this.view.turns]
      .reverse()
      .find((t) => t.role === "draft" && t.status === "pending");
    return turn?.role === "draft" ? turn : null;
  }

  private notify(notice: TalkNotice | null) {
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
    this.set({ notice });
    if (notice)
      this.noticeTimer = setTimeout(
        () => this.set({ notice: null }),
        NOTICE_MS,
      );
  }

  /** 기다리는 모습: 마이크가 켜져 있으면 듣기, 아니면 쉼 */
  private rest() {
    this.set({ phase: this.view.voice ? "listening" : "idle", liveId: null });
    this.armQuiet();
  }

  setLang(lang: TalkLang) {
    this.lang = lang;
  }

  /** 대화의 언어 — 마지막으로 방문자가 쓴 말을 따릅니다. */
  private talkLang(): TalkLang {
    const last = [...this.history].reverse().find((m) => m.role === "user");
    if (!last) return this.lang;
    return isKorean(last.content) ? "ko" : "en";
  }

  /** 구가 따라 움직일 소리 크기 0–1 (구의 애니메이션 루프가 매 프레임 읽음) */
  readLevel = () => {
    const { phase } = this.view;
    if (phase === "speaking" && this.audio) {
      this.level += (this.audio.outputLevel() - this.level) * 0.35;
    } else if (phase !== "hearing") {
      this.level *= 0.85;
    }
    return this.level;
  };

  /** 처음 열 때 한 번, 글로 인사합니다. */
  greet() {
    if (this.greeted) return;
    this.greeted = true;
    const text = GREETING[this.lang];
    this.history.push({ role: "assistant", content: text.replace(/\n/g, " ") });
    this.showLines(toLines(text));
  }

  /** 글로 대답을 새 칸으로 보여 주고, 구가 잠깐 말하는 모습을 보입니다. */
  private showLines(lines: string[], notice = false) {
    const id = ++this.seq;
    this.add({ id, role: "agent", lines, notice });
    if (notice) return this.rest();
    this.set({ phase: "speaking", liveId: id });
    this.settle();
  }

  private settle() {
    if (this.tail) clearTimeout(this.tail);
    this.tail = setTimeout(() => {
      if (!this.current && this.view.phase === "speaking") this.rest();
    }, SPEAK_TAIL_MS);
  }

  // ── 묻고 답하기 ──

  /** 방문자가 글로(또는 목소리를 받아 적어) 물었습니다. */
  ask(text: string) {
    // 받아 적기는 cciD 를 "CCID", "씨씨아이디" 로 적습니다 — 화면과 기록에는 이름대로.
    const said = text
      .trim()
      .replace(/\b[Cc]\.?\s?[Cc]\.?\s?[Ii]\.?\s?[Dd]\b|씨씨아이디/g, "cciD");
    if (!said || this.view.ended) return;
    this.interrupt();
    const content =
      this.prefix && this.prefix !== said ? `${this.prefix} ${said}` : said;
    this.prefix = "";
    this.history.push({ role: "user", content });
    this.add({ id: ++this.seq, role: "user", text: content });
    void this.respond({});
  }

  /** 추천 질문 버튼. 정해 둔 대답이 있으면 대답 서버를 부르지 않고 바로 보여 줍니다. */
  choose(index: number) {
    const suggestion = SUGGESTIONS[index];
    if (!suggestion || this.view.ended) return;
    this.set({ asked: [...this.view.asked, index] });
    const question = suggestion[this.lang];
    const answer = suggestion.answer ? answerById(suggestion.answer) : null;
    if (!answer) return this.ask(question);
    this.interrupt();
    const text = answer[this.lang];
    this.history.push({ role: "user", content: question });
    this.add({ id: ++this.seq, role: "user", text: question });
    // 마이크가 켜져 있으면 목소리로 읽어 줍니다. 아니면 글로만 (비용 0).
    if (this.view.voice) void this.respond({ fixed: text });
    else {
      this.history.push({ role: "assistant", content: text });
      this.showLines(toLines(text));
    }
  }

  /** 미리보기 아래의 "네". 말로 "네"라고 한 것과 같게 기록하고, 서버는 모델을 거치지 않고 보냅니다. */
  confirm() {
    const pending = this.pendingDraft();
    if (!pending || this.view.ended) return;
    const said = COPY[isKorean(pending.draft.message) ? "ko" : "en"].yes;
    this.interrupt();
    this.history.push({ role: "user", content: said });
    this.add({ id: ++this.seq, role: "user", text: said });
    void this.respond({ confirm: true });
  }

  /**
   * 대답 한 차례. fixed 가 있으면 대답 서버 대신 그 글을 씁니다(추천 질문을 목소리로 읽을 때).
   */
  private async respond({
    confirm = false,
    fixed,
  }: {
    confirm?: boolean;
    fixed?: string;
  }) {
    const voiced = this.view.voice && !!this.audio;
    const cur: Current = {
      ctrl: new AbortController(),
      turnId: null,
      lines: [],
      voiced,
      parts: [],
      sources: [],
      gain: null,
      cursor: this.thinkEnd ? this.thinkEnd + 0.08 : 0,
      started: false,
    };
    if (voiced && this.audio) {
      cur.gain = this.audio.ctx.createGain();
      cur.gain.connect(this.audio.master);
    }
    this.current = cur;
    const mine = () => this.current === cur;
    if (this.tail) clearTimeout(this.tail);
    if (this.view.phase !== "thinking")
      this.set({ phase: "thinking", liveId: null });

    // 미리보기는 "이렇게 전할게요 … 보낼까요?" 바로 아래에 놓습니다. 대답 칸보다 먼저 오면 잠시 들고 있습니다.
    let heldDraft: TalkDraft | null = null;
    const placeDraft = (draft: TalkDraft) => {
      // 고쳐서 다시 오면 앞의 것을 대신합니다.
      const old = this.pendingDraft();
      this.set({
        turns: [
          ...this.view.turns.filter((t) => t !== old),
          { id: ++this.seq, role: "draft", draft, status: "pending" },
        ],
      });
    };

    let token: string | null = null;
    const ensureTurn = (lines: string[], synced: boolean) => {
      if (cur.turnId === null) {
        cur.turnId = ++this.seq;
        this.add({ id: cur.turnId, role: "agent", lines, synced });
        if (heldDraft) placeDraft(heldDraft);
        heldDraft = null;
      } else this.update(cur.turnId, { lines });
    };

    let queue = Promise.resolve();
    let replyLang: TalkLang | null = null;
    const split = sentences((sentence) => {
      if (!mine()) return;
      if (!cur.voiced) {
        cur.lines.push(sentence);
        ensureTurn([...cur.lines], false);
        this.set({ phase: "speaking", liveId: cur.turnId });
        return;
      }
      // 목소리: 문장마다 바로 목소리를 받기 시작하고, 앞 문장 소리 뒤에 이어 붙입니다.
      replyLang ??= isKorean(sentence) ? "ko" : "en";
      const part: Part = {
        text: sentence,
        start: 0,
        end: 0,
        times: null,
        audio: 0,
        failed: false,
      };
      const previous = cur.parts.map((p) => p.text).join(" ");
      cur.parts.push(part);
      ensureTurn([], true);
      const res = fetch("/api/talk/speak", {
        method: "POST",
        signal: cur.ctrl.signal,
        headers: {
          "Content-Type": "application/json",
          "x-talk-pass": token ?? "",
        },
        body: JSON.stringify({ text: sentence, lang: replyLang, previous }),
      });
      queue = queue
        .then(() => this.play(cur, part, res))
        .catch(() => {
          part.failed = true;
        });
    });

    const notice = (key: "busy" | "failed" | "unavailable") => {
      if (!mine()) return;
      this.current = null;
      this.remove(cur.turnId);
      this.showLines([COPY[this.lang][key]], true);
    };

    try {
      token = await talkPass();
      if (!token) return notice("unavailable");
      if (fixed !== undefined) {
        split.push(fixed);
      } else {
        const request = (pass: string) =>
          fetch("/api/talk/chat", {
            method: "POST",
            signal: cur.ctrl.signal,
            headers: {
              "Content-Type": "application/json",
              "x-talk-pass": pass,
            },
            body: JSON.stringify({
              lang: this.lang,
              messages: this.history,
              draft: this.pendingDraft()?.draft ?? null,
              confirm,
            }),
          });
        let res = await request(token);
        // 통행증이 만료됐으면(서버가 다시 켜졌을 때 등) 한 번만 새로 받아 다시 묻습니다.
        if (res.status === 403) {
          token = await talkPass({ fresh: true });
          if (!token) return notice("unavailable");
          res = await request(token);
        }
        if (res.status === 403) return notice("unavailable");
        if (res.status === 429) return notice("busy");
        if (!res.ok || !res.body) return notice("failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let cut: number;
          while ((cut = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, cut);
            buf = buf.slice(cut + 1);
            if (!line.trim()) continue;
            const msg = JSON.parse(line) as {
              t: string;
              d?: string;
              draft?: TalkDraft;
            };
            if (msg.t === "text" && msg.d) split.push(msg.d);
            else if (msg.t === "draft" && msg.draft) {
              if (cur.turnId === null) heldDraft = msg.draft;
              else placeDraft(msg.draft);
            } else if (msg.t === "sent" || msg.t === "fallback") {
              const pending = this.pendingDraft();
              if (pending) this.update(pending.id, { status: msg.t });
            } else if (msg.t === "ended") this.set({ ended: true });
            else if (msg.t === "error") throw new Error("chat");
          }
        }
      }
      split.flush();
      if (heldDraft) placeDraft(heldDraft);
      await queue;
      if (!mine()) return;
      // 목소리: 마지막 소리가 끝날 때까지 기다립니다.
      if (cur.voiced && this.audio) {
        const ctx = this.audio.ctx;
        await this.until(cur, () => ctx.currentTime >= cur.cursor);
        if (!mine()) return;
      }
      const all = cur.voiced ? cur.parts.map((p) => p.text) : cur.lines;
      this.history.push({ role: "assistant", content: all.join(" ") });
      if (cur.turnId !== null)
        this.update(cur.turnId, { lines: all, synced: false });
      this.finish(cur);
    } catch {
      if (cur.ctrl.signal.aborted || !mine()) return;
      notice("failed");
    }
  }

  private finish(cur: Current) {
    if (this.thinkTimer) clearTimeout(this.thinkTimer);
    this.thinkEnd = 0;
    this.current = null;
    if (this.view.ended) this.stopVoice();
    if (cur.voiced) this.rest();
    else this.settle();
  }

  /** 한 문장의 소리를 받아 이어 틉니다. 글자별 시각이 오면 그걸로 화면의 글자를 맞춥니다. */
  private async play(cur: Current, part: Part, pending: Promise<Response>) {
    const res = await pending;
    const audio = this.audio;
    if (!audio || !cur.gain || this.current !== cur) return;
    const ctx = audio.ctx;
    // 목소리를 못 받으면(키 없음 · 오류) 그 문장은 글자만 바로 보여 줍니다.
    if (!res.ok || !res.body) {
      part.failed = true;
      part.start = Math.max(cur.cursor, ctx.currentTime);
      part.end = part.start;
      this.startSpeaking(cur);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    const schedule = (samples: Float32Array<ArrayBuffer>) => {
      if (!samples.length || this.current !== cur || !cur.gain) return;
      const buffer = ctx.createBuffer(1, samples.length, SAMPLE_RATE);
      buffer.copyToChannel(samples, 0);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(cur.gain);
      const at = Math.max(cur.cursor, ctx.currentTime + 0.04);
      if (!part.start) part.start = at;
      src.start(at);
      cur.sources.push(src);
      cur.cursor = at + buffer.duration;
      part.end = cur.cursor;
      part.audio += buffer.duration;
      this.startSpeaking(cur);
    };
    const handle = (line: string) => {
      const chunk = JSON.parse(line) as {
        audio_base64?: string;
        alignment?: {
          characters?: string[];
          character_start_times_seconds?: number[];
        };
      };
      if (chunk.alignment?.character_start_times_seconds && !part.times)
        part.times = chunk.alignment.character_start_times_seconds;
      if (chunk.audio_base64) schedule(pcmFromBase64(chunk.audio_base64));
    };
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let cut: number;
      while ((cut = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, cut).trim();
        buf = buf.slice(cut + 1);
        if (line) handle(line);
      }
    }
    if (buf.trim()) handle(buf.trim());
  }

  /** 첫 소리(또는 첫 글자)가 나갈 때: 말하는 모습으로 바꾸고, 들리는 만큼 글자를 드러내기 시작합니다. */
  private startSpeaking(cur: Current) {
    if (cur.started) return;
    cur.started = true;
    if (this.thinkTimer) clearTimeout(this.thinkTimer);
    this.set({ phase: "speaking", liveId: cur.turnId });
    this.reveal(cur);
  }

  /** 지금 시각까지 들린 비율. 글자별 시각이 있으면 그걸, 없으면 소리 길이를 씁니다. */
  private heard(part: Part, now: number) {
    if (part.failed) return part.start && now >= part.start ? 1 : 0;
    if (!part.start || now <= part.start) return 0;
    const t = now - part.start;
    if (part.times?.length) {
      let i = 0;
      while (i < part.times.length && (part.times[i] ?? 0) <= t) i++;
      return i / part.times.length;
    }
    return part.audio ? Math.min(1, t / part.audio) : 0;
  }

  /** 들린 만큼 글자를 드러냅니다. 소리가 끝날 때까지 프레임마다. */
  private reveal(cur: Current) {
    let shownKey = "";
    const tick = () => {
      if (this.current !== cur || !this.audio || cur.turnId === null) return;
      const now = this.audio.ctx.currentTime;
      const lines: string[] = [];
      for (const part of cur.parts) {
        const f = this.heard(part, now);
        if (f <= 0) break;
        lines.push(part.text.slice(0, revealTo(part.text, f)));
        if (f < 1) break;
      }
      const key = lines.join("\n");
      if (key !== shownKey) {
        shownKey = key;
        this.update(cur.turnId, { lines });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  private until(cur: Current, test: () => boolean) {
    return new Promise<void>((resolve) => {
      const check = () =>
        this.current !== cur || test() ? resolve() : setTimeout(check, 50);
      check();
    });
  }

  /**
   * 하던 대답을 멈춥니다. 소리가 나던 중이면 줄이며 멈추고, 들린(보인) 데까지만 기록에 남깁니다.
   * 아직 소리가 나기 전이면(생각 중) 그 차례를 없던 일로 하고, merge 면 방문자의 말을 다음 말과 합칩니다.
   */
  interrupt({ merge = false } = {}) {
    const cur = this.current;
    if (!cur) return;
    this.current = null;
    if (this.thinkTimer) clearTimeout(this.thinkTimer);
    this.thinkEnd = 0;
    cur.ctrl.abort();
    let heardText = "";
    if (cur.voiced && cur.started && this.audio && cur.gain) {
      const now = this.audio.ctx.currentTime;
      const gain = cur.gain.gain;
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(gain.value, now);
      gain.linearRampToValueAtTime(0, now + TUNE.fadeOut);
      setTimeout(
        () =>
          cur.sources.forEach((s) => {
            try {
              s.stop();
            } catch {
              /* 이미 끝남 */
            }
          }),
        TUNE.fadeOut * 1000 + 60,
      );
      // 줄어드는 동안 들리는 것까지 들은 것으로 칩니다.
      const lines: string[] = [];
      for (const part of cur.parts) {
        const f = this.heard(part, now + TUNE.fadeOut * 0.5);
        if (f <= 0) break;
        lines.push(part.text.slice(0, revealTo(part.text, f)));
        if (f < 1) break;
      }
      heardText = lines.join(" ");
      if (cur.turnId !== null)
        this.update(cur.turnId, { lines, synced: false });
    } else if (!cur.voiced) {
      heardText = cur.lines.join(" ");
    }
    if (heardText) {
      this.history.push({
        role: "assistant",
        content: `${heardText} [interrupted]`,
      });
    } else {
      this.remove(cur.turnId);
      if (merge) {
        // 방문자가 말을 마치지 않았습니다 — 앞의 말을 다음 말 앞에 붙입니다.
        const last = this.history.at(-1);
        if (last?.role === "user") {
          this.history.pop();
          this.prefix = last.content;
          const shown = [...this.view.turns]
            .reverse()
            .find((t) => t.role === "user");
          this.remove(shown?.id ?? null);
        }
      }
    }
    this.rest();
  }

  // ── 마이크 ──

  /**
   * 마이크를 켭니다. 반드시 사람이 누른 버튼 안에서 불러야 합니다(소리를 내려면 필요).
   * 여기서 브라우저가 마이크 허용을 묻습니다. 켜지면 true.
   */
  async startVoice() {
    if (this.view.voice || this.view.starting) return this.view.voice;
    this.audio ??= AudioOut.create();
    const audio = this.audio;
    if (!audio) {
      this.notify("noVoice");
      return false;
    }
    await audio.resume();
    this.set({ starting: true });
    const token = await talkPass();
    if (!token) {
      this.set({ starting: false });
      this.showLines([COPY[this.lang].unavailable], true);
      return false;
    }
    const mic = await startMic(audio, {
      onSpeechStart: () => this.onSpeechStart(),
      onSpeechRealStart: () => this.onSpeechRealStart(),
      onMisfire: () => this.onMisfire(),
      onSpeechEnd: (a) => void this.onSpeechEnd(a),
      onFrame: (probs, frame) => this.onFrame(probs.isSpeech, frame),
    });
    this.set({ starting: false });
    if (typeof mic === "string") {
      this.notify(
        mic === "blocked"
          ? "micBlocked"
          : mic === "unsupported"
            ? "noVoice"
            : "voiceFailed",
      );
      return false;
    }
    this.mic = mic;
    this.set({ voice: true });
    this.notify(null);
    if (!this.current) this.rest();
    return true;
  }

  stopVoice(notice: TalkNotice | null = null) {
    if (!this.view.voice) return;
    if (this.quietTimer) clearTimeout(this.quietTimer);
    this.mic?.stop();
    this.mic = null;
    this.speech.on = false;
    this.set({ voice: false });
    if (notice) this.notify(notice);
    if (this.view.phase === "listening" || this.view.phase === "hearing")
      this.set({ phase: "idle" });
  }

  /** 마이크를 켠 채 한동안 조용하면 끕니다. */
  private armQuiet() {
    if (this.quietTimer) clearTimeout(this.quietTimer);
    if (!this.view.voice) return;
    this.quietTimer = setTimeout(() => {
      if (this.view.phase === "listening") this.stopVoice("quiet");
    }, TUNE.quietStopMs);
  }

  private onSpeechStart() {
    if (this.quietTimer) clearTimeout(this.quietTimer);
    this.speech = { on: true, ms: 0, quietMs: 0 };
    const cur = this.current;
    if (cur?.started && cur.gain && this.audio) {
      // 먼저 낮춥니다 — 진짜 말이면 곧 멈추고, 아니면 되돌립니다.
      cur.gain.gain.setTargetAtTime(
        TUNE.duck,
        this.audio.ctx.currentTime,
        0.04,
      );
    } else if (!cur) {
      this.set({ phase: "hearing" });
    }
  }

  private onSpeechRealStart() {
    const cur = this.current;
    if (cur) this.interrupt({ merge: !cur.started });
    this.set({ phase: "hearing" });
  }

  private onMisfire() {
    this.speech.on = false;
    const cur = this.current;
    if (cur?.started && cur.gain && this.audio)
      cur.gain.gain.setTargetAtTime(1, this.audio.ctx.currentTime, 0.08);
    if (cur) return;
    // 기다리게 해 둔 앞의 말이 있으면(이어 말하는 줄 알았는데 아니었음) 이제 묻습니다.
    if (this.prefix && this.view.phase !== "thinking") {
      const said = this.prefix;
      this.prefix = "";
      this.ask(said);
      return;
    }
    if (this.view.phase === "hearing") this.rest();
  }

  private onFrame(isSpeech: number, frame: Float32Array) {
    const now = performance.now();
    const dt = this.lastFrameAt ? Math.min(100, now - this.lastFrameAt) : 32;
    this.lastFrameAt = now;
    if (this.view.phase === "hearing") {
      let sum = 0;
      for (const v of frame) sum += v * v;
      this.level +=
        (Math.min(1, Math.sqrt(sum / frame.length) * 8) - this.level) * 0.4;
    }
    if (!this.speech.on || this.current) return;
    if (isSpeech >= TUNE.threshold) {
      this.speech.ms += dt;
      this.speech.quietMs = 0;
      return;
    }
    const before = this.speech.quietMs;
    this.speech.quietMs += dt;
    // 길게 말하다 잠깐 쉬는 순간에만, 가끔.
    if (
      before < TUNE.nodPauseMs &&
      this.speech.quietMs >= TUNE.nodPauseMs &&
      this.speech.ms >= TUNE.nodAfterSpeechMs &&
      now - this.lastNodAt >= TUNE.nodGapMs &&
      Math.random() < TUNE.nodChance
    ) {
      this.lastNodAt = now;
      this.audio?.playClip(this.talkLang(), "nod", 0.45);
    }
  }

  private async onSpeechEnd(audio: Float32Array) {
    this.speech.on = false;
    if (this.current) return; // 끼어들기 직후의 꼬리 — onSpeechRealStart 가 이미 정리했습니다
    this.set({ phase: "thinking" });
    const id = ++this.listenSeq;
    const endedAt = performance.now();
    // 대답 소리가 늦으면 "음~" 한 번. 방금 맞장구를 쳤으면 하지 않습니다.
    if (this.thinkTimer) clearTimeout(this.thinkTimer);
    this.thinkEnd = 0;
    this.thinkTimer = setTimeout(() => {
      if (
        id !== this.listenSeq ||
        this.view.phase !== "thinking" ||
        this.current?.started ||
        endedAt - this.lastNodAt < 2500 ||
        !this.audio
      )
        return;
      const end = this.audio.playClip(this.talkLang(), "think", 0.55);
      if (!end) return;
      this.thinkEnd = end;
      if (this.current && !this.current.started)
        this.current.cursor = Math.max(this.current.cursor, end + 0.08);
    }, TUNE.thinkAfterMs);

    let text = "";
    let unavailable = false;
    try {
      const token = await talkPass();
      const form = new FormData();
      form.append("audio", wav(audio), "speech.wav");
      const res = await fetch("/api/talk/listen", {
        method: "POST",
        headers: { "x-talk-pass": token ?? "" },
        body: form,
      });
      if (res.ok)
        text = (((await res.json()) as { text?: string }).text ?? "").trim();
      else if (res.status === 503) unavailable = true;
    } catch {
      /* 못 알아들음 */
    }
    if (id !== this.listenSeq) return;
    // 받아 적기를 쓸 수 없음(키 없음 등) — 마이크를 끄고 글로 넘어갑니다.
    if (unavailable) {
      if (this.thinkTimer) clearTimeout(this.thinkTimer);
      this.stopVoice("voiceFailed");
      return;
    }
    if (/^[\s.,!?…~-]*$/.test(text)) text = "";
    // 받아 적는 사이 방문자가 다시 말을 시작했습니다 — 다음 말과 합칩니다.
    if (this.speech.on) {
      if (this.thinkTimer) clearTimeout(this.thinkTimer);
      if (text) this.prefix = (this.prefix ? `${this.prefix} ` : "") + text;
      return;
    }
    if (!text && !this.prefix) {
      if (this.thinkTimer) clearTimeout(this.thinkTimer);
      this.rest();
      return;
    }
    this.ask(text || this.prefix);
  }

  /** 대화 창을 닫을 때: 하던 대답을 멈추고 마이크를 끕니다. 대화 내용은 남습니다. */
  close() {
    this.interrupt();
    this.stopVoice();
  }

  /** 화면에서 빠질 때: 하던 대답을 멈추고 마이크를 끕니다. (구독은 React 가 스스로 풉니다) */
  destroy() {
    this.interrupt();
    this.stopVoice();
    if (this.tail) clearTimeout(this.tail);
    this.audio?.close();
    this.audio = null;
  }
}
