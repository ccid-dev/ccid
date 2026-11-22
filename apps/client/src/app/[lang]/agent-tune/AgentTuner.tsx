"use client";

import classNames from "classnames";
import { button, folder, Leva, monitor, useControls } from "leva";
import { useEffect, useRef, useState } from "react";
import { RulerSlider } from "@repo/common";
import {
  type AgentBlobLabels,
  BLOB_PRESET_KEYS,
  BLOB_STATES,
  BlobCanvas,
  type BlobBase,
  type BlobConfig,
  type BlobPreset,
  type BlobSituation,
  type BlobState,
  DEFAULT_BLOB_CONFIG,
  useMicLevel,
} from "@/components/agent-blob";
import {
  BASE_GROUPS,
  type BaseSection,
  PRESET_GROUPS,
  SITUATION_GROUPS,
  SITUATION_INFO,
} from "./fields";

const isState = (s: BlobSituation): s is BlobState =>
  (BLOB_STATES as readonly string[]).includes(s);

const baseOf = (config: BlobConfig): BlobBase => ({
  flow: config.flow,
  panel: config.panel,
  voice: config.voice,
  motion: config.motion,
});

/** flow 구의 색 (원본 flow-cursor.json 이름 · 패널 이름) */
const FLOW_COLORS = [
  ["colorA", "위"],
  ["colorB", "아래"],
  ["colorC", "옆"],
  ["colorWarm", "가운데"],
  ["rim", "테두리"],
] as const;

/** 파일에 그대로 붙여 넣을 JSON (prettier 와 같은 모양) */
const toJson = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

/** 프리셋 파일이 있는 곳 */
const PRESET_DIR = "apps/client/src/components/agent-blob/presets";

/** 미리보기 구 크기(기본 · 크기 슬라이더 범위 · 헤더 크기) · 펼쳤을 때 대화 창 크기 */
const PREVIEW = {
  orb: 200,
  minSize: 24,
  maxSize: 320,
  /** 눈금 한 칸 (px). 헤더 크기 40 · 기본 200 이 눈금 위에 오도록 */
  sizeStep: 4,
  headerSize: 40,
  panelW: "min(360px, 90%)",
  panelH: "min(460px, 88%)",
  ease: "cubic-bezier(.22,1,.36,1)",
};

/** Leva 패널 이름(평평한 이름) — 상황 값 p_<키> · 공통 값 b_<구역>_<키> · 색 · 스타일 f_<키> */
const presetKey = (key: string) => `p_${key}`;
const baseKey = (section: BaseSection, key: string) => `b_${section}_${key}`;

const presetValues = (preset: BlobPreset) =>
  Object.fromEntries(BLOB_PRESET_KEYS.map((k) => [presetKey(k), preset[k]]));

const baseValues = (base: BlobBase) => ({
  f_style: base.flow.style,
  ...Object.fromEntries(FLOW_COLORS.map(([k]) => [`f_${k}`, base.flow[k]])),
  ...Object.fromEntries(
    BASE_GROUPS.flatMap((group) =>
      group.fields.map((f) => [
        baseKey(group.section, f.key),
        (base[group.section] as Record<string, number>)[f.key],
      ]),
    ),
  ),
});

const download = (file: string, text: string) => {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = file;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * 에이전트 구 튜닝 화면 (/agent-tune).
 * 왼쪽(화면 대부분): 미리보기 — 상황 탭 · 구(누르면 대화 창으로 펼쳐짐) · 크기 눈금자.
 * 오른쪽 위: 조절 패널(Leva) — 지금 상황 값 · 공통 값 · 음성 · 파일로 내보내기.
 * 내보낸 JSON 은 presets/<상황>.json 에, 공통 값은 presets/base.json 에 그대로 붙여 넣습니다.
 */
export function AgentTuner({ labels }: { labels: AgentBlobLabels }) {
  const [draft, setDraft] = useState<BlobConfig>(() =>
    structuredClone(DEFAULT_BLOB_CONFIG),
  );
  const [situation, setSituation] = useState<BlobSituation>("idle");
  const [expanded, setExpanded] = useState(false);
  const [orbSize, setOrbSize] = useState(PREVIEW.orb);
  const [toast, setToast] = useState("");
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const expandedOnceRef = useRef(false);

  // 패널 버튼 · 값 바뀜에서 최신 상태를 읽기 위한 보관함
  const situationRef = useRef(situation);
  const draftRef = useRef(draft);
  const setPanelRef = useRef<(values: Record<string, unknown>) => void>(
    () => {},
  );
  const micRef = useRef<() => number>(() => 0);

  const updatePreset = (key: keyof BlobPreset, value: number) =>
    setDraft((d) => {
      const s = situationRef.current;
      if (d.situations[s][key] === value) return d;
      return {
        ...d,
        situations: {
          ...d.situations,
          [s]: { ...d.situations[s], [key]: value },
        },
      };
    });
  const updateBase = (section: BaseSection, key: string, value: number) =>
    setDraft((d) =>
      (d[section] as Record<string, number>)[key] === value
        ? d
        : { ...d, [section]: { ...d[section], [key]: value } },
    );
  /** 색 · 스타일 (숫자 값은 updateBase) */
  const updateFlow = <K extends keyof BlobConfig["flow"]>(
    key: K,
    value: BlobConfig["flow"][K],
  ) =>
    setDraft((d) =>
      d.flow[key] === value ? d : { ...d, flow: { ...d.flow, [key]: value } },
    );

  const [panel, setPanel] = useControls(() => ({
    // ── 지금 상황 값 (탭을 바꾸면 그 상황 값으로 바뀜) ──
    ...Object.fromEntries(
      PRESET_GROUPS.map((group) => [
        `지금 상황 · ${group.title}`,
        folder(
          Object.fromEntries(
            group.fields.map((f) => [
              presetKey(f.key),
              {
                value: DEFAULT_BLOB_CONFIG.situations.idle[f.key],
                min: f.min,
                max: f.max,
                step: f.step,
                label: f.label,
                hint: f.hint,
                onChange: (v: number) => updatePreset(f.key, v),
                transient: false,
              },
            ]),
          ),
        ),
      ]),
    ),
    // ── 공통 값 (모든 상황) ──
    "공통 · 색": folder({
      f_style: {
        value: DEFAULT_BLOB_CONFIG.flow.style,
        options: ["plasma", "glass", "liquid"],
        label: "스타일",
        onChange: (v: string) => updateFlow("style", v),
        transient: false,
      },
      ...Object.fromEntries(
        FLOW_COLORS.map(([k, label]) => [
          `f_${k}`,
          {
            value: DEFAULT_BLOB_CONFIG.flow[k],
            label: `색 · ${label}`,
            onChange: (v: string) => updateFlow(k, v),
            transient: false,
          },
        ]),
      ),
    }),
    ...Object.fromEntries(
      BASE_GROUPS.map((group) => [
        `공통 · ${group.title}`,
        folder(
          Object.fromEntries(
            group.fields.map((f) => [
              baseKey(group.section, f.key),
              {
                value:
                  (
                    DEFAULT_BLOB_CONFIG[group.section] as Record<string, number>
                  )[f.key] ?? 0,
                min: f.min,
                max: f.max,
                step: f.step,
                label: f.label,
                hint: f.hint,
                onChange: (v: number) => updateBase(group.section, f.key, v),
                transient: false,
              },
            ]),
          ),
          { collapsed: true },
        ),
      ]),
    ),
    // ── 음성 (listening 일 때만 실제 마이크) ──
    음성: folder({
      voice: { value: false, label: "실제 음성 인식" },
      입력: monitor(() => micRef.current(), { graph: true, interval: 40 }),
    }),
    // ── 파일로 내보내기 ──
    "파일로 내보내기": folder({
      "상황 JSON 복사": button(() => {
        const s = situationRef.current;
        void navigator.clipboard
          .writeText(toJson(draftRef.current.situations[s]))
          .then(() =>
            setToast(`복사했어요 · presets/${s}.json 에 붙여 넣으세요`),
          )
          .catch(() => setToast("복사하지 못했어요 · 다운로드를 써 주세요"));
      }),
      "상황 JSON 다운로드": button(() => {
        const s = situationRef.current;
        download(`${s}.json`, toJson(draftRef.current.situations[s]));
        setToast(`다운로드했어요 · presets/${s}.json 을 바꿔 넣으세요`);
      }),
      "상황 기존값으로": button(() => {
        const s = situationRef.current;
        const preset = DEFAULT_BLOB_CONFIG.situations[s];
        setDraft((d) => ({
          ...d,
          situations: { ...d.situations, [s]: structuredClone(preset) },
        }));
        setPanelRef.current(presetValues(preset));
        setToast(`${s} 를 파일 값으로 되돌렸어요`);
      }),
      "공통 JSON 복사": button(() => {
        void navigator.clipboard
          .writeText(toJson(baseOf(draftRef.current)))
          .then(() =>
            setToast("복사했어요 · presets/base.json 에 붙여 넣으세요"),
          )
          .catch(() => setToast("복사하지 못했어요 · 다운로드를 써 주세요"));
      }),
      "공통 JSON 다운로드": button(() => {
        download("base.json", toJson(baseOf(draftRef.current)));
        setToast("다운로드했어요 · presets/base.json 을 바꿔 넣으세요");
      }),
      "공통 기존값으로": button(() => {
        const base = structuredClone(baseOf(DEFAULT_BLOB_CONFIG));
        setDraft((d) => ({ ...d, ...base }));
        setPanelRef.current(baseValues(base));
        setToast("공통 값을 파일 값으로 되돌렸어요");
      }),
    }),
  }));
  const voice = Boolean((panel as Record<string, unknown>).voice);

  const state: BlobState = isState(situation) ? situation : "idle";
  const force =
    situation === "hover" || situation === "press" ? situation : undefined;
  const listening = voice && state === "listening";
  const micLevel = useMicLevel(listening);

  useEffect(() => {
    draftRef.current = draft;
    micRef.current = listening ? micLevel : () => 0;
    setPanelRef.current = setPanel as (values: Record<string, unknown>) => void;
  });

  // 탭을 바꾸면 패널의 '지금 상황 값' 을 그 상황 값으로
  useEffect(() => {
    situationRef.current = situation;
    setPanelRef.current(presetValues(draftRef.current.situations[situation]));
  }, [situation]);

  // 펼치면 닫기(X)로, 접으면 다시 구로 포커스 · Esc 로 접기
  useEffect(() => {
    if (expanded) {
      expandedOnceRef.current = true;
      closeButtonRef.current?.focus();
      const onKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") setExpanded(false);
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
    if (expandedOnceRef.current) openButtonRef.current?.focus();
  }, [expanded]);

  // 안내 문구는 잠깐만
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  /** 파일 값과 다른 항목 수 (탭의 분홍 점) */
  const situationChangeCount = (s: BlobSituation) =>
    BLOB_PRESET_KEYS.filter(
      (k) => draft.situations[s][k] !== DEFAULT_BLOB_CONFIG.situations[s][k],
    ).length;

  return (
    <div
      className={classNames(
        // 헤더(72px)를 뺀 화면 높이 · 오른쪽은 패널(Leva) 자리
        "h-[calc(100svh-4.5rem)] p-3 lg:pr-[372px]",
        "bg-background",
      )}
    >
      <Leva
        titleBar={{ title: "Agent Tune", filter: false }}
        theme={{ sizes: { rootWidth: "340px", controlWidth: "170px" } }}
      />

      {/* 왼쪽: 미리보기 (스크롤 고정) */}
      <section aria-label="미리보기" className={classNames("h-full")}>
        <div
          className={classNames(
            "h-full",
            "flex flex-col",
            "rounded-3xl border border-gray-200 bg-background",
          )}
        >
          {/* 상황 탭: 언제 쓰이는지로 두 묶음 (잘리지 않게 모두 보이기) */}
          <div
            className={classNames(
              "flex flex-col gap-3",
              "border-b border-gray-200 px-4 pt-4 pb-3",
            )}
          >
            <h1 className={classNames("font-neuehaas text-lg")}>Agent Tune</h1>
            <div
              role="tablist"
              aria-label="상황"
              className={classNames("grid gap-3 xl:grid-cols-2")}
            >
              {SITUATION_GROUPS.map((group) => (
                <div
                  key={group.title}
                  className={classNames("flex flex-col gap-1.5")}
                >
                  <p className={classNames("px-1 text-xs text-sub")}>
                    {group.title}
                  </p>
                  <div
                    className={classNames(
                      "grid grid-cols-3 gap-1",
                      "rounded-2xl bg-gray-100 p-1",
                    )}
                  >
                    {group.items.map((s) => {
                      const active = situation === s;
                      const count = situationChangeCount(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setSituation(s)}
                          className={classNames(
                            "h-12 min-w-0",
                            "relative flex flex-col items-center justify-center",
                            "rounded-xl transition",
                            active
                              ? "bg-white text-main shadow-sm"
                              : "text-sub hover:bg-white/60 hover:text-main",
                          )}
                        >
                          <span
                            className={classNames(
                              "max-w-full truncate px-1",
                              "font-neuehaas text-sm font-medium",
                            )}
                          >
                            {s}
                          </span>
                          <span className={classNames("text-[11px] text-mute")}>
                            {SITUATION_INFO[s].name}
                          </span>
                          {count > 0 && (
                            <span
                              aria-label={`${count}개 바뀜`}
                              className={classNames(
                                "absolute top-1.5 right-1.5 size-1.5",
                                "rounded-full bg-pink",
                              )}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {/* 지금 상황 설명 */}
            <p className={classNames("px-1 text-sm break-keep text-sub")}>
              <span
                className={classNames("font-neuehaas font-medium text-main")}
              >
                {situation} {SITUATION_INFO[situation].name}
              </span>
              {" · "}
              {SITUATION_INFO[situation].when}
            </p>
          </div>

          {/* 무대: 구를 누르면 대화 창으로 펼쳐짐 · 바깥을 누르면 접힘 */}
          <div
            onClick={(event) => {
              if (expanded && event.target === event.currentTarget)
                setExpanded(false);
            }}
            className={classNames(
              "min-h-0 flex-1",
              "flex items-center justify-center",
            )}
          >
            <div
              style={{
                width: expanded ? PREVIEW.panelW : orbSize,
                height: expanded ? PREVIEW.panelH : orbSize,
                transition: `width .7s ${PREVIEW.ease}, height .7s ${PREVIEW.ease}`,
              }}
            >
              <BlobCanvas
                state={state}
                force={force}
                expanded={expanded}
                interactive={!expanded && !force}
                level={listening ? micLevel : undefined}
                config={draft}
              >
                {expanded ? (
                  <PreviewModal
                    title={labels.title}
                    situation={situation}
                    closeButtonRef={closeButtonRef}
                    onClose={() => setExpanded(false)}
                  />
                ) : (
                  <button
                    ref={openButtonRef}
                    type="button"
                    aria-label="눌러서 대화 창(모달)으로 보기"
                    onClick={() => setExpanded(true)}
                    className={classNames(
                      "absolute inset-0 rounded-full",
                      "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple",
                    )}
                  />
                )}
              </BlobCanvas>
            </div>
          </div>

          {/* 아래: 미리보기 구 크기 (눈금자) · 안내 */}
          <div
            className={classNames("flex flex-col items-center gap-3 px-4 pb-4")}
          >
            <RulerSlider
              value={orbSize}
              onChange={setOrbSize}
              min={PREVIEW.minSize}
              max={PREVIEW.maxSize}
              step={PREVIEW.sizeStep}
              format={(v) => `${v}px`}
              label="미리보기 구 크기"
              disabled={expanded}
              className={classNames("w-full max-w-md text-main")}
            />
            <div
              className={classNames(
                "w-full",
                "flex items-center justify-between gap-4",
              )}
            >
              <p className={classNames("text-xs text-sub break-keep")}>
                {expanded
                  ? "✕ 를 누르거나 바깥을 누르면 구로 돌아가요."
                  : "구를 누르면 대화 창(모달)으로 펼쳐져요. 눈금자를 끌어 크기를 바꿔 보세요."}
              </p>
              <button
                type="button"
                aria-pressed={orbSize === PREVIEW.headerSize}
                disabled={expanded}
                onClick={() =>
                  setOrbSize(
                    orbSize === PREVIEW.headerSize
                      ? PREVIEW.orb
                      : PREVIEW.headerSize,
                  )
                }
                className={classNames(
                  "h-7 px-3 text-xs",
                  "inline-flex shrink-0 items-center gap-1.5",
                  "rounded-full border transition",
                  "font-neuehaas font-medium whitespace-nowrap",
                  "disabled:pointer-events-none disabled:opacity-40",
                  orbSize === PREVIEW.headerSize
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-background hover:border-gray-400",
                )}
              >
                헤더 크기 {PREVIEW.headerSize}px
              </button>
            </div>
          </div>
        </div>
      </section>

      {toast ? (
        <p
          role="status"
          className={classNames(
            "fixed bottom-6 left-1/2 z-[1001] -translate-x-1/2",
            "rounded-full bg-black px-4 py-2",
            "text-sm text-white",
          )}
        >
          {toast}
        </p>
      ) : null}
      <p className={classNames("sr-only")}>{PRESET_DIR}</p>
    </div>
  );
}

/** 미리보기에서 펼친 대화 창 */
function PreviewModal({
  title,
  situation,
  closeButtonRef,
  onClose,
}: {
  title: string;
  situation: BlobSituation;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const inModal = situation !== "hover" && situation !== "press";
  return (
    <div
      role="dialog"
      aria-label={title}
      className={classNames(
        "h-full",
        "flex flex-col gap-3 p-4",
        "text-primary",
        // 창이 다 커질 즈음 내용이 나타납니다.
        "transition-opacity delay-350 duration-300 starting:opacity-0",
      )}
    >
      <header className={classNames("flex items-center justify-between")}>
        <h2 className={classNames("font-neuehaas text-lg font-medium")}>
          {title}
        </h2>
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="닫고 구로 돌아가기"
          onClick={onClose}
          className={classNames(
            "size-8",
            "flex items-center justify-center",
            "rounded-full bg-white/60 transition hover:bg-white/80",
          )}
        >
          <span aria-hidden>✕</span>
        </button>
      </header>
      <div
        className={classNames(
          "flex-1",
          "flex flex-col items-center justify-center gap-1",
          "text-center",
        )}
      >
        <p className={classNames("font-neuehaas text-2xl font-medium")}>
          {inModal ? situation : "idle"}
        </p>
        <p className={classNames("text-xs break-keep opacity-70")}>
          {inModal
            ? "위 탭으로 listening · thinking · speaking 을 바꿔 보세요."
            : "hover · press 는 대화 창에서는 쓰이지 않아요."}
        </p>
      </div>
    </div>
  );
}
