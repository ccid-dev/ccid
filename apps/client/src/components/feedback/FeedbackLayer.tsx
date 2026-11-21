"use client";

import classNames from "classnames";
import { usePathname, useRouter } from "next/navigation";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@repo/common";
import type { FeedbackComment, FeedbackInput, FeedbackTarget } from "./types";

const API = "/api/feedback";
/** 코멘트 레이어 자신의 요소 표시 (이 안의 누르기는 가로채지 않음) */
const OWN_UI = "[data-feedback-ui]";
/** 코멘트 창 너비 · 누른 곳과의 간격 · 화면 끝 여백 (px) */
const POPOVER = { width: 320, gap: 14, edge: 16 };
/** 컴포넌트 이름 중 Next.js · React · motion 안쪽 부품은 빼고 남깁니다 */
const FRAMEWORK_NAME =
  /Router|Boundary|Handler|Template|Provider|Segment|Fallback|HotReload|DevRoot|ServerRoot|^Head$|^LinkComponent$|^Motion/;

type Point = { x: number; y: number };
type Box = { left: number; top: number; width: number; height: number };
type Draft = {
  /** 코멘트를 쓰기 시작한 페이지 (다른 페이지로 가면 창을 숨김) */
  page: string;
  element: Element;
  target: FeedbackTarget;
  point: Point;
};
/** 매 프레임 다시 재는 화면 위치 (스크롤 · 등장 모션 · 창 크기 변경을 따라감) */
type Layout = {
  viewport: { width: number; height: number };
  /** 가리키거나 고른 요소 테두리 */
  highlight: Box | null;
  /** 쓰는 중인 코멘트 창의 기준점 */
  draft: Point | null;
  /** 이 페이지 코멘트의 핀 위치 (요소를 못 찾으면 빠짐) */
  pins: Record<string, Point>;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value || 0));
const round = (value: number) => Math.round(value * 1000) / 1000;
const pointIn = (rect: DOMRect, point: Point): Point => ({
  x: rect.left + rect.width * point.x,
  y: rect.top + rect.height * point.y,
});

/** 요소를 다시 찾을 CSS 선택자 — id 가 있으면 거기서 멈추고, 없으면 body 까지 nth-of-type 으로 */
function cssSelector(element: Element) {
  const parts: string[] = [];
  let node: Element | null = element;
  while (node && node !== document.body) {
    if (node.id) return [`#${CSS.escape(node.id)}`, ...parts].join(" > ");
    const tag = node.tagName.toLowerCase();
    const siblings: Element[] = node.parentElement
      ? [...node.parentElement.children]
      : [];
    const same = siblings.filter((child) => child.tagName === node!.tagName);
    parts.unshift(
      same.length > 1 ? `${tag}:nth-of-type(${same.indexOf(node) + 1})` : tag,
    );
    node = node.parentElement;
  }
  return ["body", ...parts].join(" > ");
}

type Fiber = {
  type?: unknown;
  return?: Fiber | null;
  _debugInfo?: { name?: unknown }[] | null;
};

/** 요소를 그린 React 컴포넌트 이름 (안쪽 → 바깥, 최대 4개). 개발 모드의 React 내부 정보를 읽습니다. */
function componentNames(element: Element) {
  const key = Object.keys(element).find((name) =>
    name.startsWith("__reactFiber$"),
  );
  let fiber = key
    ? (element as unknown as Record<string, Fiber | undefined>)[key]
    : undefined;
  const names: string[] = [];
  const add = (name: unknown) => {
    if (typeof name !== "string" || !name || FRAMEWORK_NAME.test(name)) return;
    if (!names.includes(name)) names.push(name);
  };
  while (fiber && names.length < 4) {
    const { type } = fiber;
    if (typeof type === "function") {
      add((type as { displayName?: string }).displayName ?? type.name);
    } else if (typeof type === "object" && type) {
      // memo · forwardRef 로 감싼 컴포넌트
      const inner = type as {
        displayName?: string;
        render?: { name?: string };
        type?: { name?: string };
      };
      add(inner.displayName ?? inner.render?.name ?? inner.type?.name);
    }
    // 서버 컴포넌트는 fiber 가 없고 _debugInfo 에 이름만 남습니다.
    for (const info of fiber._debugInfo ?? []) add(info.name);
    fiber = fiber.return ?? undefined;
  }
  return names;
}

function describe(element: Element): FeedbackTarget {
  const text =
    (element.textContent ?? "").replace(/\s+/g, " ").trim() ||
    element.getAttribute("alt") ||
    element.getAttribute("aria-label") ||
    "";
  return {
    selector: cssSelector(element),
    tag: element.tagName.toLowerCase(),
    text: text.slice(0, 80),
    components: componentNames(element),
  };
}

function findElement(selector: string) {
  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
}

/** 기준점 옆에 코멘트 창을 띄울 자리 — 오른쪽 · 아래가 좁으면 반대쪽으로 */
function popoverPlace(anchor: Point, viewport: Layout["viewport"]) {
  const { gap, edge } = POPOVER;
  const width = Math.min(POPOVER.width, viewport.width - edge * 2);
  const toRight = anchor.x + gap + width <= viewport.width - edge;
  const toLeft = anchor.x - gap - width >= edge;
  const below = anchor.y < viewport.height * 0.6;
  const style: CSSProperties = {
    width,
    left: toRight
      ? anchor.x + gap
      : toLeft
        ? anchor.x - gap - width
        : (viewport.width - width) / 2,
    top: below ? anchor.y + gap : undefined,
    bottom: below ? undefined : viewport.height - anchor.y + gap,
    // 누른 곳에서 펼쳐지도록
    transformOrigin: `${toRight ? "left" : toLeft ? "right" : "center"} ${below ? "top" : "bottom"}`,
  };
  return style;
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** 고른 요소 요약 — 태그 · 가장 안쪽 컴포넌트 */
const targetLabel = (target: FeedbackTarget) =>
  [target.tag, target.components[0]].filter(Boolean).join(" · ");

/**
 * 사이트 위 피드백 코멘트 (개발 서버 전용 — Layout 에서 next dev 일 때만 붙임).
 * - 왼쪽 아래 '코멘트 남기기'를 켜고 고칠 요소를 누르면 그 자리에 코멘트를 씁니다.
 *   켜져 있는 동안에는 링크 · 버튼이 동작하지 않고 누른 요소만 고릅니다. (Esc 로 끝내기)
 * - 코멘트는 루트 .feedback/comments.json 에 저장되고 (app/api/feedback),
 *   페이지 · 요소 선택자 · 컴포넌트 이름 · 글자가 함께 남아서 Claude 가 읽고 고칠 수 있습니다.
 * - 이 페이지의 코멘트는 번호 핀으로 보이고, 누르면 완료 표시 · 삭제를 할 수 있습니다.
 * - 창으로 돌아올 때마다 파일을 다시 읽어서, Claude 가 반영하며 남긴 메모가 바로 보입니다.
 */
export function FeedbackLayer() {
  const pathname = usePathname();
  const router = useRouter();
  const [comments, setComments] = useState<FeedbackComment[]>([]);
  const [error, setError] = useState("");
  /** 코멘트 모드: 요소를 눌러 코멘트를 남기고, 이 페이지의 핀이 보입니다 */
  const [active, setActive] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftText, setDraftText] = useState("");
  const [saving, setSaving] = useState(false);
  /** 펼쳐 본 핀 */
  const [openId, setOpenId] = useState<string | null>(null);
  /** 삭제를 한 번 누른 코멘트 (한 번 더 누르면 지움) */
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [layout, setLayout] = useState<Layout>({
    viewport: { width: 0, height: 0 },
    highlight: null,
    draft: null,
    pins: {},
  });
  /** 마우스가 가리키는 요소 — 그리기 루프가 읽음 */
  const hoverRef = useRef<Element | null>(null);
  /** 쓰던 글이 있으면 다른 곳을 눌러도 창을 바꾸지 않으려고 (이벤트 처리기가 읽음) */
  const draftTextRef = useRef("");
  /** 목록에서 고른 코멘트 — 요소가 나타나면 그쪽으로 스크롤 */
  const focusRef = useRef<string | null>(null);

  const currentDraft = draft?.page === pathname ? draft : null;
  const pageComments = useMemo(
    () => comments.filter((comment) => comment.page === pathname),
    [comments, pathname],
  );
  const openComment = pageComments.find((comment) => comment.id === openId);
  const openSelector = openComment?.target.selector ?? null;
  const openCount = comments.filter((item) => item.status === "open").length;

  useEffect(() => {
    draftTextRef.current = draftText;
  }, [draftText]);

  const request = useCallback(async (init?: RequestInit, query = "") => {
    const response = await fetch(`${API}${query}`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error ?? response.statusText);
    return data;
  }, []);

  const refresh = useCallback(async () => {
    try {
      setComments(await request());
      setError("");
    } catch (reason) {
      setError((reason as Error).message);
    }
  }, [request]);

  // 처음 한 번 + 창으로 돌아올 때마다 (그사이 Claude 가 파일을 고쳤을 수 있어서) 다시 읽습니다.
  useEffect(() => {
    const onFocus = () => void refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    onFocus();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  // 코멘트 모드: 가리키는 요소를 기억하고, 페이지의 누르기를 막고 고른 요소에 코멘트 창을 엽니다.
  useEffect(() => {
    if (!active) return;
    const isOwn = (target: EventTarget | null) =>
      target instanceof Element && Boolean(target.closest(OWN_UI));
    const pick = (x: number, y: number) => {
      const found = document.elementFromPoint(x, y);
      if (!found || found.closest(OWN_UI)) return null;
      // 아이콘 안쪽 path 대신 svg 전체
      return found.closest("svg") ?? found;
    };
    const onMove = (event: PointerEvent) => {
      hoverRef.current = pick(event.clientX, event.clientY);
    };
    const onLeave = () => {
      hoverRef.current = null;
    };
    // 링크 이동 · 버튼 동작 · 스와이퍼 끌기 등이 일어나지 않게 막습니다.
    const block = (event: Event) => {
      if (isOwn(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
    };
    const onClick = (event: MouseEvent) => {
      if (isOwn(event.target)) return;
      block(event);
      if (draftTextRef.current.trim()) return;
      const element = pick(event.clientX, event.clientY);
      if (!element) return;
      const rect = element.getBoundingClientRect();
      setOpenId(null);
      setListOpen(false);
      setDraft({
        page: window.location.pathname,
        element,
        target: describe(element),
        point: {
          x: round(clamp01((event.clientX - rect.left) / rect.width)),
          y: round(clamp01((event.clientY - rect.top) / rect.height)),
        },
      });
    };
    const blocked = [
      "pointerdown",
      "mousedown",
      "pointerup",
      "mouseup",
      "dblclick",
    ];
    window.addEventListener("pointermove", onMove, {
      capture: true,
      passive: true,
    });
    document.addEventListener("pointerleave", onLeave);
    for (const type of blocked)
      window.addEventListener(type, block, { capture: true });
    window.addEventListener("click", onClick, { capture: true });
    return () => {
      hoverRef.current = null;
      window.removeEventListener("pointermove", onMove, { capture: true });
      document.removeEventListener("pointerleave", onLeave);
      for (const type of blocked)
        window.removeEventListener(type, block, { capture: true });
      window.removeEventListener("click", onClick, { capture: true });
    };
  }, [active]);

  // 그리기 루프: 고른 요소 · 핀 · 코멘트 창 위치를 매 프레임 다시 재서, 바뀌었을 때만 화면을 고칩니다.
  useEffect(() => {
    if (!active) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let frame = 0;
    let last = "";
    const tick = () => {
      const pins: Layout["pins"] = {};
      for (const comment of pageComments) {
        const element = findElement(comment.target.selector);
        const rect = element?.getBoundingClientRect();
        if (!element || !rect || (!rect.width && !rect.height)) continue;
        pins[comment.id] = pointIn(rect, comment.point);
        if (focusRef.current === comment.id) {
          focusRef.current = null;
          element.scrollIntoView({
            block: "center",
            behavior: reduce ? "auto" : "smooth",
          });
        }
      }
      // 테두리: 쓰는 중인 요소 → 펼친 핀의 요소 → 가리키는 요소
      const selected = currentDraft?.element.isConnected
        ? currentDraft.element
        : openSelector
          ? findElement(openSelector)
          : hoverRef.current?.isConnected
            ? hoverRef.current
            : null;
      const rect = selected?.getBoundingClientRect();
      const next: Layout = {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        highlight: rect
          ? {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            }
          : null,
        draft:
          currentDraft && currentDraft.element.isConnected
            ? pointIn(
                currentDraft.element.getBoundingClientRect(),
                currentDraft.point,
              )
            : null,
        pins,
      };
      const key = JSON.stringify(next, (_, value) =>
        typeof value === "number" ? Math.round(value) : value,
      );
      if (key !== last) {
        last = key;
        setLayout(next);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, currentDraft, openSelector, pageComments]);

  const closeDraft = () => {
    setDraft(null);
    setDraftText("");
  };

  const toggleActive = () => {
    if (active) {
      closeDraft();
      setOpenId(null);
    } else {
      void refresh();
    }
    setActive(!active);
  };

  const toggleList = () => {
    if (!listOpen) void refresh();
    setListOpen(!listOpen);
  };

  // Esc: 쓰던 창 → 펼친 핀 → 목록 → 코멘트 모드 순서로 닫습니다.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.isComposing) return;
      if (draft) {
        setDraft(null);
        setDraftText("");
      } else if (openId) setOpenId(null);
      else if (listOpen) setListOpen(false);
      else if (active) setActive(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, draft, listOpen, openId]);

  const save = async () => {
    if (!currentDraft || !draftText.trim() || saving) return;
    setSaving(true);
    const input: FeedbackInput = {
      page: currentDraft.page,
      comment: draftText,
      target: currentDraft.target,
      point: currentDraft.point,
      viewport: { width: window.innerWidth, height: window.innerHeight },
    };
    try {
      const created: FeedbackComment = await request({
        method: "POST",
        body: JSON.stringify(input),
      });
      setComments((prev) => [...prev, created]);
      closeDraft();
      setError("");
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (comment: FeedbackComment) => {
    try {
      const updated: FeedbackComment = await request({
        method: "PATCH",
        body: JSON.stringify({
          id: comment.id,
          status: comment.status === "open" ? "done" : "open",
        }),
      });
      setComments((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (reason) {
      setError((reason as Error).message);
    }
  };

  const remove = async (comment: FeedbackComment) => {
    try {
      await request(
        { method: "DELETE" },
        `?id=${encodeURIComponent(comment.id)}`,
      );
      setComments((prev) => prev.filter((item) => item.id !== comment.id));
      setOpenId(null);
    } catch (reason) {
      setError((reason as Error).message);
    }
  };

  /** 목록에서 고르면 그 페이지로 가서 핀을 펼치고 요소로 스크롤 */
  const focus = (comment: FeedbackComment) => {
    focusRef.current = comment.id;
    closeDraft();
    setOpenId(comment.id);
    setListOpen(false);
    setActive(true);
    if (comment.page !== pathname) router.push(comment.page);
  };

  // 목록: 지금 페이지를 맨 위에, 나머지는 페이지별로
  const byPage = new Map<string, FeedbackComment[]>();
  for (const comment of comments)
    byPage.set(comment.page, [...(byPage.get(comment.page) ?? []), comment]);
  const groups = [...byPage].sort(
    ([a], [b]) => Number(b === pathname) - Number(a === pathname),
  );

  const openAnchor = openComment
    ? (layout.pins[openComment.id] ?? {
        // 요소를 찾지 못하면 화면 위쪽 가운데에
        x: layout.viewport.width / 2,
        y: layout.viewport.height / 4,
      })
    : null;

  return (
    <div data-feedback-ui className={classNames("contents")}>
      {active && layout.highlight ? (
        <div
          aria-hidden
          style={layout.highlight}
          className={classNames(
            "pointer-events-none fixed z-[90000]",
            "rounded-sm bg-primary/10 ring-2 ring-primary",
          )}
        />
      ) : null}

      {active
        ? pageComments.map((comment) => {
            const pin = layout.pins[comment.id];
            if (!pin) return null;
            const done = comment.status === "done";
            return (
              <button
                key={comment.id}
                type="button"
                aria-label={`코멘트 ${comment.number}`}
                aria-expanded={openId === comment.id}
                onClick={() => {
                  closeDraft();
                  setConfirmingId(null);
                  setOpenId(openId === comment.id ? null : comment.id);
                }}
                style={{ left: pin.x, top: pin.y }}
                className={classNames(
                  "size-7",
                  "fixed z-[90000] flex items-center justify-center",
                  [
                    "-translate-1/2 rounded-full shadow-lg shadow-black/15",
                    "transition-[scale,opacity] duration-150 ease-out hover:scale-110 active:scale-90 starting:scale-75 starting:opacity-0 motion-reduce:transition-none",
                    done ? "bg-white" : "bg-primary",
                    { "ring-2 ring-white": openId === comment.id && !done },
                    { "ring-2 ring-primary": openId === comment.id && done },
                  ],
                  [
                    "font-neuehaas text-xs font-medium",
                    done ? "text-mute" : "text-white",
                  ],
                )}
              >
                {done ? "✓" : comment.number}
              </button>
            );
          })
        : null}

      {active && currentDraft && layout.draft ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
          style={popoverPlace(layout.draft, layout.viewport)}
          className={classNames(
            "fixed z-[90001] flex flex-col gap-3",
            "p-4",
            "rounded-3xl bg-white/95 shadow-xl shadow-black/10 backdrop-blur",
            "transition-[scale,opacity] duration-150 ease-out starting:scale-96 starting:opacity-0 motion-reduce:transition-none",
          )}
        >
          <p className={classNames("min-w-0", "text-xs text-mute")}>
            <span
              translate="no"
              className={classNames("font-neuehaas font-medium")}
            >
              {targetLabel(currentDraft.target)}
            </span>
            {currentDraft.target.text ? (
              <span className={classNames("block truncate")}>
                “{currentDraft.target.text}”
              </span>
            ) : null}
          </p>
          <textarea
            autoFocus
            rows={3}
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                void save();
              }
            }}
            aria-label="코멘트 내용"
            placeholder="어떻게 바꾸면 좋을지 적어 주세요…"
            className={classNames(
              "w-full resize-none",
              "p-3",
              "rounded-2xl bg-field outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              "text-sm leading-relaxed text-main placeholder:text-mute",
            )}
          />
          <div className={classNames("flex items-center gap-1")}>
            <span className={classNames("flex-1", "text-xs text-mute")}>
              ⌘↵ 저장 · Esc 취소
            </span>
            <Button variant="ghost" size="sm" onClick={closeDraft}>
              취소
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={saving}
              disabled={!draftText.trim()}
              className={classNames("bg-primary active:scale-97")}
            >
              저장
            </Button>
          </div>
        </form>
      ) : null}

      {active && openComment && openAnchor ? (
        <div
          role="dialog"
          aria-label={`코멘트 ${openComment.number}`}
          style={popoverPlace(openAnchor, layout.viewport)}
          className={classNames(
            "fixed z-[90001] flex flex-col gap-3",
            "p-4",
            "rounded-3xl bg-white/95 shadow-xl shadow-black/10 backdrop-blur",
            "transition-[scale,opacity] duration-150 ease-out starting:scale-96 starting:opacity-0 motion-reduce:transition-none",
          )}
        >
          <p
            className={classNames(
              "flex items-center gap-2",
              "font-neuehaas text-xs text-mute",
            )}
          >
            <span className={classNames("font-medium text-main")}>
              #{openComment.number}
            </span>
            <span>
              {openComment.status === "done" ? "반영됨" : "남음"} ·{" "}
              {formatTime(openComment.createdAt)}
            </span>
          </p>
          <p
            className={classNames(
              "text-sm leading-relaxed break-words whitespace-pre-wrap text-main",
            )}
          >
            {openComment.comment}
          </p>
          {openComment.note ? (
            <p
              className={classNames(
                "p-3",
                "rounded-2xl bg-sheet/60",
                "text-xs leading-relaxed text-sub",
              )}
            >
              반영 메모 · {openComment.note}
            </p>
          ) : null}
          {layout.pins[openComment.id] ? null : (
            <p className={classNames("text-xs text-mute")}>
              요소를 찾지 못했습니다. 화면이 바뀌었을 수 있어요.
            </p>
          )}
          <div className={classNames("flex items-center gap-1")}>
            <span
              translate="no"
              className={classNames(
                "min-w-0 flex-1",
                "truncate font-neuehaas text-xs text-mute",
              )}
            >
              {targetLabel(openComment.target)}
            </span>
            {/* 한 번 더 눌러야 지워집니다 (되돌릴 수 없어서) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                confirmingId === openComment.id
                  ? void remove(openComment)
                  : setConfirmingId(openComment.id)
              }
            >
              {confirmingId === openComment.id ? "한 번 더 눌러 삭제" : "삭제"}
            </Button>
            <Button
              size="sm"
              onClick={() => void toggleStatus(openComment)}
              className={classNames("bg-primary active:scale-97")}
            >
              {openComment.status === "done" ? "다시 열기" : "완료"}
            </Button>
          </div>
        </div>
      ) : null}

      <div
        className={classNames(
          // 가운데 아래 — 왼쪽 아래는 Next.js 개발 표시, 오른쪽 아래는 에이전트 구 자리
          "fixed bottom-5 left-1/2 z-[90000] flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-8",
        )}
      >
        {listOpen ? (
          <div
            className={classNames(
              "max-h-[60vh] w-80 max-w-[calc(100vw-2.5rem)]",
              "overflow-y-auto overscroll-contain",
              "p-2",
              "origin-bottom rounded-3xl bg-white/95 shadow-xl shadow-black/10 backdrop-blur",
              "transition-[scale,opacity] duration-150 ease-out starting:scale-96 starting:opacity-0 motion-reduce:transition-none",
            )}
          >
            {groups.length ? (
              groups.map(([page, items]) => (
                <section key={page}>
                  <h2
                    className={classNames(
                      "px-3 pt-3 pb-1",
                      "font-neuehaas text-xs text-mute",
                    )}
                  >
                    {page}
                    {page === pathname ? " · 이 페이지" : ""}
                  </h2>
                  <ul>
                    {items.map((comment) => (
                      <li key={comment.id}>
                        <button
                          type="button"
                          onClick={() => focus(comment)}
                          className={classNames(
                            "w-full",
                            "flex items-start gap-3",
                            "px-3 py-2",
                            "rounded-2xl transition-colors hover:bg-sheet/60",
                            "text-left",
                          )}
                        >
                          <span
                            className={classNames(
                              "size-5 shrink-0",
                              "flex items-center justify-center",
                              "mt-0.5",
                              "rounded-full",
                              comment.status === "done"
                                ? "bg-sheet"
                                : "bg-primary",
                              [
                                "font-neuehaas text-[10px] font-medium",
                                comment.status === "done"
                                  ? "text-mute"
                                  : "text-white",
                              ],
                            )}
                          >
                            {comment.status === "done" ? "✓" : comment.number}
                          </span>
                          <span className={classNames("min-w-0 flex-1")}>
                            <span
                              className={classNames(
                                "line-clamp-2 text-sm leading-snug",
                                comment.status === "done"
                                  ? "text-mute"
                                  : "text-main",
                              )}
                            >
                              {comment.comment}
                            </span>
                            {comment.note ? (
                              <span
                                className={classNames(
                                  "mt-1",
                                  "line-clamp-2 block text-xs text-sub",
                                )}
                              >
                                반영 · {comment.note}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            ) : (
              <p className={classNames("px-3 py-4", "text-sm text-sub")}>
                아직 코멘트가 없습니다.
              </p>
            )}
          </div>
        ) : null}

        <div
          className={classNames(
            "flex items-center gap-1",
            "p-1",
            "rounded-xl bg-white/90 shadow-lg shadow-black/10 backdrop-blur",
          )}
        >
          <button
            type="button"
            aria-pressed={active}
            onClick={toggleActive}
            className={classNames(
              "h-8",
              "px-3",
              "rounded-lg transition-[background-color,scale] duration-150 ease-out active:scale-97",
              active ? "bg-primary" : "hover:bg-sheet/60",
              [
                "font-neuehaas text-sm font-medium whitespace-nowrap",
                active ? "text-white" : "text-main",
              ],
            )}
          >
            {active ? "코멘트 끝내기" : "코멘트 남기기"}
          </button>
          <button
            type="button"
            aria-expanded={listOpen}
            onClick={toggleList}
            className={classNames(
              "h-8",
              "flex items-center gap-1.5",
              "px-3",
              "rounded-lg transition-[background-color,scale] duration-150 ease-out active:scale-97",
              listOpen ? "bg-sheet" : "hover:bg-sheet/60",
              "font-neuehaas text-sm font-medium whitespace-nowrap text-main",
            )}
          >
            목록
            <span className={classNames("text-mute")}>{openCount}</span>
          </button>
          {active && !currentDraft && !openComment ? (
            <span
              className={classNames(
                "hidden sm:inline",
                "px-2",
                "text-xs whitespace-nowrap text-sub",
              )}
            >
              고칠 곳을 누르세요 · Esc 로 끝내기
            </span>
          ) : null}
        </div>

        {error ? (
          <p
            role="alert"
            className={classNames(
              "max-w-80",
              "px-3 py-2",
              "rounded-2xl bg-white/95 shadow-lg shadow-black/10",
              "text-xs text-red-500",
            )}
          >
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
