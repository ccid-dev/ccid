"use client";

import classNames from "classnames";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { APP_INFO } from "@/config";
import { type Locale, localePath } from "@/i18n";
import { SUGGESTIONS } from "./talk/answers";
import type { TalkDraft, TalkNotice, TalkTurn, TalkView } from "./talk/chat";

/** 대화 창 안의 문구 (dict.agent) */
export type TalkLabels = {
  placeholder: string;
  send: string;
  thinking: string;
  ended: string;
  suggestions: string;
  to: string;
  yes: string;
  sentTo: string;
  mailApp: string;
  subject: string;
  /** 마이크 버튼 */
  mic: string;
  micOff: string;
  /** 마이크를 켜기 전 사이트 안 안내 (브라우저 허용 창보다 먼저) */
  askTitle: string;
  askBody: string;
  askNote: string;
  askAllow: string;
  askDecline: string;
  askHint: string;
  /** 목소리로 대화할 때 입력 줄 위 상태 */
  starting: string;
  listening: string;
  speaking: string;
  notices: Record<TalkNotice, string>;
};

/** 대답에 나오는 메뉴 이름은 그 페이지 링크가 됩니다. */
const PAGES: Record<string, string> = {
  Research: "/research",
  Projects: "/projects",
  People: "/people",
};
const PAGE_WORD = /^(.*?)\b(Research|Projects|People)\b(.*)$/;

function mailto(draft: TalkDraft, labels: TalkLabels) {
  const subject = `${labels.subject}: ${draft.name}`;
  const body = [
    draft.message,
    "",
    "—",
    draft.name,
    draft.organization,
    draft.email,
  ]
    .filter((v, i) => i < 4 || v)
    .join("\n");
  return `mailto:${APP_INFO.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

type PanelProps = {
  view: TalkView;
  labels: TalkLabels;
  lang: Locale;
  onAsk: (text: string) => void;
  onChoose: (index: number) => void;
  onConfirm: () => void;
  /** 대답 속 페이지 링크를 눌렀을 때 (대화 창 닫기) */
  onNavigate: () => void;
  /** 마이크 켜기 (브라우저가 허용을 물음). 켜지면 true */
  onMicStart: () => Promise<boolean>;
  onMicStop: () => void;
};

/**
 * 대화 창 내용: 주고받은 대화(아래로 쌓임, 위로 스크롤해 앞 대화 보기) · 미리보기 · 추천 질문 · 입력 줄.
 * 대화 흐름은 talk/chat.ts 가 맡고, 여기는 그리기만 합니다.
 */
export function TalkPanel({
  view,
  labels,
  lang,
  onAsk,
  onChoose,
  onConfirm,
  onNavigate,
  onMicStart,
  onMicStop,
}: PanelProps) {
  const [text, setText] = useState("");
  /** 마이크를 켜기 전 안내 카드가 떠 있는지 */
  const [asking, setAsking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // 새 말이 오면 맨 아래로 (대화 창을 다시 열었을 때도)
  const last = view.turns.at(-1);
  const lastSize = last?.role === "agent" ? last.lines.length : 0;
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [view.turns.length, lastSize, view.phase, reduce]);
  // 창이 커지는 동안(열릴 때) · 화면 크기가 바뀔 때도 맨 아래에 붙어 있게
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      el.scrollTop = el.scrollHeight;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    onAsk(text);
    setText("");
  };

  const word = (w: string) => {
    const m = w.match(PAGE_WORD);
    const page = m?.[2] ? PAGES[m[2]] : undefined;
    if (!m || !page) return w;
    return (
      <>
        {m[1]}
        <Link
          href={localePath(lang, page)}
          onClick={onNavigate}
          className={classNames("underline underline-offset-4")}
        >
          {m[2]}
        </Link>
        {m[3]}
      </>
    );
  };

  const turn = (t: TalkTurn) => {
    if (t.role === "user")
      return (
        <p
          key={t.id}
          className={classNames(
            "max-w-[85%]",
            "self-end",
            "px-4 py-2",
            "rounded-2xl bg-white/60",
            "text-sm text-main",
          )}
        >
          {t.text}
        </p>
      );

    if (t.role === "draft")
      return (
        <DraftCard
          key={t.id}
          turn={t}
          labels={labels}
          busy={view.phase === "thinking"}
          onConfirm={onConfirm}
        />
      );

    // 에이전트의 대답: 문장마다 새 줄. 지금 말하는 칸은 단어가 하나씩 떠오르고, 말하는 동안 앞 줄은 옅어집니다.
    const live = t.id === view.liveId;
    return (
      <div
        key={t.id}
        className={classNames(
          "flex flex-col gap-1",
          "text-lg leading-snug font-medium md:text-xl",
          t.notice ? "text-sub" : "text-primary",
        )}
      >
        {t.lines.map((line, i) => (
          <p
            key={i}
            className={classNames(
              "transition-opacity duration-500",
              live && i < t.lines.length - 1 && "opacity-40",
            )}
          >
            {line.split(/(?<= )/).map((w, j) =>
              live && !reduce ? (
                <motion.span
                  key={j}
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.35, delay: j * 0.05 }}
                >
                  {word(w)}
                </motion.span>
              ) : (
                <span key={j}>{word(w)}</span>
              ),
            )}
          </p>
        ))}
      </div>
    );
  };

  const remaining = SUGGESTIONS.map((s, i) => ({ s, i })).filter(
    ({ i }) => !view.asked.includes(i),
  );
  const status = view.notice
    ? labels.notices[view.notice]
    : view.ended
      ? labels.ended
      : view.starting
        ? labels.starting
        : view.phase === "thinking"
          ? labels.thinking
          : view.voice && view.phase === "speaking"
            ? labels.speaking
            : view.voice
              ? labels.listening
              : "";

  // 마이크 버튼: 이미 허용한 방문자는 안내 없이 바로 켜고, 처음이면 사이트 안에서 먼저 설명합니다.
  // 막아 둔 방문자는 브라우저가 다시 묻지 않으므로, 켜는 법을 안내하고 글로 이어 갑니다.
  const micClick = async () => {
    if (view.voice) return onMicStop();
    let state: PermissionState | null = null;
    try {
      state = (
        await navigator.permissions.query({
          name: "microphone" as PermissionName,
        })
      ).state;
    } catch {
      /* 묻는 기능이 없는 브라우저 — 안내 카드부터 */
    }
    if (state === "granted") return void onMicStart();
    if (state === "denied") {
      setAsking(false);
      return void onMicStart(); // 막혀 있음 → chat 이 micBlocked 안내
    }
    setAsking(true);
  };
  const allowMic = () => {
    setAsking(false);
    void onMicStart();
  };
  const declineMic = () => {
    setAsking(false);
    inputRef.current?.focus();
  };

  return (
    <>
      <div
        ref={scrollRef}
        aria-live="polite"
        className={classNames(
          "min-h-0 flex-1",
          // 가로로는 넘치지 않게 (긴 이메일 · 주소도 줄바꿈)
          "-mx-4 overflow-x-hidden overflow-y-auto overscroll-contain",
          // 위쪽은 흐려지며 사라져 앞 대화가 더 있다는 걸 보여 줍니다.
          "[mask-image:linear-gradient(to_bottom,transparent,black_2.5rem)]",
        )}
      >
        <div
          className={classNames(
            "min-h-full",
            "flex flex-col justify-end gap-5",
            "px-4 pt-10 pb-1",
            "wrap-break-word",
          )}
        >
          {view.turns.map(turn)}
        </div>
      </div>

      <p
        aria-live="polite"
        className={classNames("min-h-5", "text-sm text-sub")}
      >
        {status}
      </p>

      {/* 마이크를 켜기 전 안내: 무엇을 듣고 무엇을 하지 않는지 먼저 알리고, 고르게 합니다. */}
      {asking && !view.voice && (
        <section
          aria-labelledby="talk-mic-ask"
          className={classNames("p-4", "rounded-2xl bg-white/90", "text-sm")}
        >
          <h3
            id="talk-mic-ask"
            className={classNames("text-base font-medium text-primary")}
          >
            {labels.askTitle}
          </h3>
          <p className={classNames("mt-2", "whitespace-pre-line text-main")}>
            {labels.askBody}
          </p>
          <p className={classNames("mt-2", "text-xs text-mute")}>
            {labels.askNote}
          </p>
          <div className={classNames("mt-4 flex flex-wrap gap-2")}>
            <button
              type="button"
              onClick={allowMic}
              className={classNames(
                "px-3 py-2",
                "rounded-lg bg-primary transition hover:opacity-90",
                "text-white",
              )}
            >
              {labels.askAllow}
            </button>
            <button
              type="button"
              onClick={declineMic}
              className={classNames(
                "px-3 py-2",
                "rounded-lg bg-black/5 transition hover:bg-black/10",
                "text-main",
              )}
            >
              {labels.askDecline}
            </button>
          </div>
          <p className={classNames("mt-3", "text-xs text-mute")}>
            {labels.askHint}
          </p>
        </section>
      )}

      {/* 입력 상자: 추천 질문(아직 고르지 않은 것) + 입력 줄 */}
      <div className={classNames("p-1.5", "rounded-2xl bg-white/70")}>
        {remaining.length > 0 && !view.ended && (
          <ul
            aria-label={labels.suggestions}
            className={classNames("flex flex-wrap gap-1.5", "p-1 pb-2")}
          >
            {remaining.map(({ s, i }) => (
              <li key={s.ko}>
                <button
                  type="button"
                  onClick={() => onChoose(i)}
                  className={classNames(
                    "px-3 py-1.5",
                    "rounded-lg bg-white/70 transition hover:bg-white",
                    "text-sm text-primary",
                  )}
                >
                  {s[lang]}
                </button>
              </li>
            ))}
          </ul>
        )}
        <form
          onSubmit={submit}
          className={classNames("flex items-center gap-2", "pl-2.5")}
        >
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={view.ended}
            placeholder={labels.placeholder}
            aria-label={labels.placeholder}
            maxLength={600}
            className={classNames(
              "min-w-0 flex-1",
              "bg-transparent outline-none",
              "text-base text-main placeholder:text-mute",
            )}
          />
          {/* 마이크: 켜져 있으면 진한 바탕 (누르면 끔) */}
          <button
            type="button"
            onClick={() => void micClick()}
            disabled={view.ended || view.starting}
            aria-pressed={view.voice}
            aria-label={view.voice ? labels.micOff : labels.mic}
            title={view.voice ? labels.micOff : labels.mic}
            className={classNames(
              "size-9 shrink-0",
              "flex items-center justify-center",
              "rounded-lg transition disabled:opacity-40",
              view.voice
                ? "bg-primary text-white hover:opacity-90"
                : "bg-white/70 text-primary hover:bg-white",
            )}
          >
            <MicIcon />
          </button>
          <button
            type="submit"
            disabled={view.ended || !text.trim()}
            className={classNames(
              "px-3 py-2",
              "rounded-lg bg-primary transition hover:opacity-90 disabled:opacity-40",
              "text-sm text-white",
            )}
          >
            {labels.send}
          </button>
        </form>
      </div>
    </>
  );
}

function MicIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
      className={classNames("size-5")}
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </svg>
  );
}

/** 팀에 보낼 메시지 미리보기 (고칠 수 없음 — 고치려면 말로) */
function DraftCard({
  turn,
  labels,
  busy,
  onConfirm,
}: {
  turn: Extract<TalkTurn, { role: "draft" }>;
  labels: TalkLabels;
  busy: boolean;
  onConfirm: () => void;
}) {
  const { draft, status } = turn;
  return (
    <div
      className={classNames(
        "p-4",
        "rounded-2xl bg-white/80",
        "text-sm text-main",
      )}
    >
      <p className={classNames("text-xs text-mute")}>{labels.to}</p>
      <p className={classNames("mt-2 whitespace-pre-line")}>{draft.message}</p>
      <p className={classNames("mt-3", "text-sub")}>
        {[draft.name, draft.organization].filter(Boolean).join(", ")}
        <br />
        {draft.email}
      </p>
      {status === "pending" && !busy && (
        <button
          type="button"
          onClick={onConfirm}
          className={classNames(
            "mt-3 px-3 py-2",
            "rounded-lg bg-primary transition hover:opacity-90",
            "text-white",
          )}
        >
          ✓ {labels.yes}
        </button>
      )}
      {status === "sent" && (
        <p className={classNames("mt-3", "text-primary")}>✓ {labels.sentTo}</p>
      )}
      {status === "fallback" && (
        <a
          href={mailto(draft, labels)}
          className={classNames(
            "mt-3 inline-block px-3 py-2",
            "rounded-lg bg-primary transition hover:opacity-90",
            "text-white",
          )}
        >
          {labels.mailApp}
        </a>
      )}
    </div>
  );
}
