"use client";

import classNames from "classnames";
import { folder, Leva, LevaPanel, useControls, useCreateStore } from "leva";
import Link from "next/link";
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
import { simulatedLevel } from "@/components/agent-blob/engine/renderer";
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
  orb: 100,
  minSize: 24,
  maxSize: 320,
  /** 눈금 한 칸 (px). 헤더 크기 40 · 기본 100 이 눈금 위에 오도록 */
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

/** Leva 조절 항목 묶음 (useControls 에 넘기는 값) */
type LevaSchema = Record<string, unknown>;

/** 조절 패널(Leva) 모양 */
const LEVA_THEME = {
  sizes: { rootWidth: "100%", controlWidth: "52%" },
  colors: {
    // 값 묶음(폴더) 뒤의 상자 배경을 없애 카드 배경 하나로 보이게 (슬라이더 트랙은 elevation1 이라 그대로)
    elevation2: "transparent",
    // 툴팁 글자가 원래 elevation2 를 써서 따로 지정
    toolTipText: "#181c20",
  },
};

/** 공통 값 숫자 읽기 */
const baseNumber = (config: BlobConfig, section: BaseSection, key: string) =>
  (config[section] as Record<string, number>)[key] ?? 0;

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
 * 오른쪽: 조절 패널 2개 — ① 공통 값(모든 상황의 바탕) ② 상황별 값.
 * ① 은 presets/base.json, ② 는 presets/<상황>.json 에 통째로 붙여 넣습니다.
 * listening · speaking 에서는 미리보기 아래에 음성 그래프가 뜨고, listening 을 처음 고르면 마이크를 쓸지 묻습니다.
 */
export function AgentTuner({
  labels,
  homeHref,
}: {
  labels: AgentBlobLabels;
  /** "사이트로" 링크 (언어별 홈 주소) */
  homeHref: string;
}) {
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

  /** 페이지 설명 모달 — 페이지를 열 때마다(새로고침 포함) 뜨고, '이 페이지는 무엇인가요?' 로 다시 열기 */
  const [showIntro, setShowIntro] = useState(true);
  const closeIntro = () => setShowIntro(false);

  /** listening 에서 마이크를 쓸지 (처음 listening 을 고를 때 물어봄) */
  const [voice, setVoice] = useState(false);
  const [askVoice, setAskVoice] = useState(false);
  const askedVoiceRef = useRef(false);

  // 패널 값 바뀜에서 최신 상태를 읽기 위한 보관함 (Leva 의 onChange 는 처음 한 번만 만들어짐)
  const situationRef = useRef(situation);
  const draftRef = useRef(draft);
  const setSituationPanelRef = useRef<
    (values: Record<string, unknown>) => void
  >(() => {});

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
      baseNumber(d, section, key) === value
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

  // ② 상황별 값 — 탭을 바꾸면 그 상황 값으로 바뀜
  const situationStore = useCreateStore();
  const [, setSituationPanel] = useControls(
    () =>
      Object.fromEntries(
        PRESET_GROUPS.map((group) => [
          group.title,
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
    { store: situationStore },
  );

  // ① 공통 값 — 모든 상황의 바탕. 묶음마다 패널을 따로 만들어 가로로 늘어놓습니다.
  const [baseResetKey, setBaseResetKey] = useState(0);
  const baseGroups: { title: string; schema: () => LevaSchema }[] = [
    {
      title: "색",
      schema: () => ({
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
              label,
              onChange: (v: string) => updateFlow(k, v),
              transient: false,
            },
          ]),
        ),
      }),
    },
    ...BASE_GROUPS.map((group) => ({
      title: group.title,
      schema: () =>
        Object.fromEntries(
          group.fields.map((f) => [
            baseKey(group.section, f.key),
            {
              value: baseNumber(DEFAULT_BLOB_CONFIG, group.section, f.key),
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
    })),
  ];

  // ── 내보내기 · 되돌리기 (패널 아래 버튼) ──
  const copyJson = (value: unknown, file: string) => {
    void navigator.clipboard
      .writeText(toJson(value))
      .then(() => setToast(`복사했어요 · ${file} 에 통째로 붙여 넣으세요`))
      .catch(() => setToast("복사하지 못했어요 · 다운로드를 써 주세요"));
  };
  const downloadJson = (value: unknown, file: string) => {
    const name = file.split("/").pop() ?? file;
    download(name, toJson(value));
    setToast(`다운로드했어요 · ${name} 을 개발 담당자에게 보내 주세요`);
  };
  const situationFile = `presets/${situation}.json`;
  const resetSituation = () => {
    const preset = structuredClone(DEFAULT_BLOB_CONFIG.situations[situation]);
    setDraft((d) => ({
      ...d,
      situations: { ...d.situations, [situation]: preset },
    }));
    setSituationPanel(presetValues(preset));
    setToast(`${situation} 를 파일 값으로 되돌렸어요`);
  };
  const resetBase = () => {
    const base = structuredClone(baseOf(DEFAULT_BLOB_CONFIG));
    setDraft((d) => ({ ...d, ...base }));
    // 공통 패널들을 파일 값으로 다시 만들기
    setBaseResetKey((k) => k + 1);
    setToast("공통 값을 파일 값으로 되돌렸어요");
  };

  const state: BlobState = isState(situation) ? situation : "idle";
  const force =
    situation === "hover" || situation === "press" ? situation : undefined;
  const listening = voice && state === "listening";
  const micLevel = useMicLevel(listening);
  /** 음성 그래프에 그릴 값: 마이크를 켠 listening 이면 내 목소리, 아니면 구가 쓰는 가짜 음성 곡선 */
  const readVoice = listening
    ? micLevel
    : () => simulatedLevel(state, performance.now() / 1000);
  const voiceLabel =
    state === "speaking"
      ? "에이전트 목소리 (가짜 음성)"
      : listening
        ? "내 목소리 (마이크)"
        : "가짜 음성 (마이크 꺼짐)";

  /** 상황 탭 고르기 — listening 을 처음 고르면 마이크를 쓸지 물어봄 */
  const selectSituation = (s: BlobSituation) => {
    setSituation(s);
    if (s === "listening" && !askedVoiceRef.current) {
      askedVoiceRef.current = true;
      setAskVoice(true);
    }
  };

  useEffect(() => {
    draftRef.current = draft;
    setSituationPanelRef.current = setSituationPanel as (
      values: Record<string, unknown>,
    ) => void;
  });

  // 탭을 바꾸면 패널의 상황 값을 그 상황 값으로
  useEffect(() => {
    situationRef.current = situation;
    setSituationPanelRef.current(
      presetValues(draftRef.current.situations[situation]),
    );
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

  // 마이크 묻는 창: Esc 로 닫기 (= 가짜 음성)
  useEffect(() => {
    if (!askVoice) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAskVoice(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [askVoice]);

  // 설명 모달: Esc 로 닫기
  useEffect(() => {
    if (!showIntro) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowIntro(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showIntro]);

  // 화면 전체를 덮는 동안 뒤 페이지는 스크롤되지 않게
  useEffect(() => {
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = overflow;
    };
  }, []);

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
  /** 공통 값에서 파일 값과 다른 항목 수 */
  const baseChangeCount =
    (Object.keys(draft.flow) as (keyof BlobConfig["flow"])[]).filter(
      (k) => draft.flow[k] !== DEFAULT_BLOB_CONFIG.flow[k],
    ).length +
    BASE_GROUPS.filter((g) => g.section !== "flow")
      .flatMap((g) => g.fields.map((f) => [g.section, f.key] as const))
      .filter(
        ([section, key]) =>
          baseNumber(draft, section, key) !==
          baseNumber(DEFAULT_BLOB_CONFIG, section, key),
      ).length;
  /** 보내야 할 파일: 공통 값을 바꿨으면 base.json + 값을 바꾼 상황 파일 */
  const filesToSend = [
    ...(JSON.stringify(baseOf(draft)) !==
    JSON.stringify(baseOf(DEFAULT_BLOB_CONFIG))
      ? ["base.json"]
      : []),
    ...SITUATION_GROUPS.flatMap((g) => g.items)
      .filter((s) => situationChangeCount(s) > 0)
      .map((s) => `${s}.json`),
  ];

  return (
    <div
      className={classNames(
        // 화면 전체를 덮음 (사이트 헤더 z-40 위 · 페이지 전환 z-95 · 커서 아래)
        // 넓은 화면: 왼쪽(3) = 미리보기 + 아래 공통 값 · 오른쪽(2) = 상황별 값 / 좁은 화면: 위아래로 쌓고 이 안에서 스크롤
        "fixed inset-0 z-50",
        "flex flex-col gap-3 overflow-y-auto overscroll-contain p-3 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:grid-rows-1 lg:overflow-hidden",
        "bg-background",
      )}
    >
      {/* 기본 떠 있는 패널은 숨기고, 카드로 나눠 보여 줍니다 */}
      <Leva hidden />

      {/* 왼쪽 반: 미리보기 + 아래 공통 값 */}
      <div className={classNames("lg:min-h-0", "flex flex-col gap-3")}>
        <section
          aria-label="미리보기"
          className={classNames(
            "h-[calc(100svh-1.5rem)] shrink-0 lg:h-auto lg:min-h-0 lg:flex-1",
            "relative flex flex-col",
            "rounded-3xl border border-gray-200 bg-background",
          )}
        >
          <div
            className={classNames(
              "flex items-center justify-between gap-3",
              "px-5 pt-4",
            )}
          >
            <div className={classNames("flex items-center gap-3")}>
              <Link
                href={homeHref}
                className={classNames(
                  "h-8 px-3",
                  "inline-flex items-center",
                  "rounded-full bg-gray-100 transition hover:bg-gray-200",
                  "text-xs font-medium text-main",
                )}
              >
                ← 사이트로
              </Link>
              <h1 className={classNames("font-neuehaas text-lg")}>
                Agent Tune
              </h1>
            </div>
            <p className={classNames("text-xs text-sub")}>
              미리보기 ·{" "}
              <span
                className={classNames("font-neuehaas font-medium text-main")}
              >
                {situation} {SITUATION_INFO[situation].name}
              </span>
            </p>
          </div>

          {/* 사용법 다시 보기 · 지금 보낼 파일 */}
          <div
            className={classNames(
              "mx-5 mt-3",
              "flex items-center justify-between gap-3",
              "rounded-2xl bg-gray-100 px-4 py-2.5",
              "text-xs text-sub",
            )}
          >
            <button
              type="button"
              onClick={() => setShowIntro(true)}
              className={classNames(
                "shrink-0",
                "font-medium text-main underline-offset-2 hover:underline",
              )}
            >
              이 페이지는 무엇인가요?
            </button>
            <span className={classNames("truncate")}>
              지금 보낼 파일:{" "}
              <span className={classNames("font-medium text-main")}>
                {filesToSend.length
                  ? filesToSend.join(" · ")
                  : "아직 바꾼 값이 없어요"}
              </span>
            </span>
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
                // 마우스 반응은 끔 — hover · press 효과는 그 탭을 골랐을 때만 보여 줍니다
                interactive={false}
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

          {/* listening · speaking: 실시간 음성 그래프 (마이크 켜기 · 끄기) */}
          {state === "listening" || state === "speaking" ? (
            <VoiceMeter
              read={readVoice}
              label={voiceLabel}
              color={draft.flow.colorB}
              mic={
                state === "listening"
                  ? { on: voice, toggle: () => setVoice(!voice) }
                  : undefined
              }
            />
          ) : null}

          {/* listening 을 처음 고르면: 실제 마이크를 쓸지 묻기 */}
          {askVoice ? (
            <div
              className={classNames(
                "absolute inset-0 z-10",
                "flex items-center justify-center p-6",
                "rounded-3xl bg-white/70 backdrop-blur-sm",
              )}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="voice-ask-title"
                className={classNames(
                  "w-full max-w-sm",
                  "flex flex-col gap-3 p-5",
                  "rounded-2xl bg-white shadow-lg",
                )}
              >
                <h2
                  id="voice-ask-title"
                  className={classNames("text-base font-medium text-main")}
                >
                  실제 마이크로 들어볼까요?
                </h2>
                <p className={classNames("text-sm break-keep text-sub")}>
                  listening 은 사용자의 말을 듣는 상황이에요. 마이크를 켜면 내
                  목소리 크기에 맞춰 구가 반응해요. 켜지 않으면 미리 만든 가짜
                  음성으로 보여 줘요.
                </p>
                <p className={classNames("text-xs break-keep text-mute")}>
                  소리는 녹음되거나 저장되지 않아요. 나중에 아래 음성 막대에서도
                  켜고 끌 수 있어요.
                </p>
                <div className={classNames("flex gap-2 pt-1")}>
                  <button
                    type="button"
                    autoFocus
                    onClick={() => {
                      setVoice(true);
                      setAskVoice(false);
                    }}
                    className={classNames(
                      "h-9 px-4",
                      "rounded-lg bg-black transition hover:bg-black/80",
                      "text-sm font-medium text-white",
                    )}
                  >
                    마이크 켜기
                  </button>
                  <button
                    type="button"
                    onClick={() => setAskVoice(false)}
                    className={classNames(
                      "h-9 px-4",
                      "rounded-lg bg-gray-100 transition hover:bg-gray-200",
                      "text-sm font-medium text-main",
                    )}
                  >
                    가짜 음성으로 보기
                  </button>
                </div>
              </div>
            </div>
          ) : null}

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
        </section>

        {/* ① 공통 값: 묶음을 가로로 늘어놓고, 넘치면 좌우 스크롤 */}
        <PanelCard
          step={1}
          title="공통 값"
          badge="모든 상황"
          description="모든 상황의 바탕이에요. 먼저 정하세요. 묶음이 많으면 좌우로 넘겨 보세요."
          file="presets/base.json"
          onCopy={() => copyJson(baseOf(draft), "presets/base.json")}
          onDownload={() => downloadJson(baseOf(draft), "presets/base.json")}
          onReset={resetBase}
          changedCount={baseChangeCount}
          actionsInHeader
          className={classNames("lg:h-[21rem]")}
        >
          <FadeScroll
            axis="x"
            className={classNames(
              "h-full",
              "flex gap-4 overflow-x-auto overscroll-x-contain px-2 pb-3",
            )}
          >
            {baseGroups.map((group) => (
              <BaseGroupPanel
                key={`${group.title}-${baseResetKey}`}
                title={group.title}
                schema={group.schema}
              />
            ))}
          </FadeScroll>
        </PanelCard>
      </div>

      {/* 오른쪽 반: ② 상황 고르기 + 그 상황 값 (세로 스크롤) */}
      <div
        aria-label="조절 패널"
        className={classNames("lg:min-h-0", "flex flex-col")}
      >
        <PanelCard
          grow
          step={2}
          title="상황별 값"
          badge={`${situation} · ${SITUATION_INFO[situation].name}`}
          description="공통 값 위에서, 상황마다 달라지는 움직임 · 빛 · 크기를 조절해요. 상황마다 따로 저장돼요."
          file={situationFile}
          onCopy={() => copyJson(draft.situations[situation], situationFile)}
          onDownload={() =>
            downloadJson(draft.situations[situation], situationFile)
          }
          onReset={resetSituation}
          changedCount={situationChangeCount(situation)}
          lead={
            <div className={classNames("flex flex-col gap-3 px-4 pb-3")}>
              <div
                role="tablist"
                aria-label="상황"
                className={classNames("flex flex-col gap-3")}
              >
                {SITUATION_GROUPS.map((group) => (
                  <div
                    key={group.title}
                    className={classNames("flex flex-col gap-1.5")}
                  >
                    <p className={classNames("text-[11px] text-white/55")}>
                      {group.title}
                    </p>
                    <div
                      className={classNames(
                        "grid grid-cols-3 gap-1",
                        "rounded-xl bg-white/5 p-1",
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
                            onClick={() => selectSituation(s)}
                            className={classNames(
                              "h-11 min-w-0",
                              "relative flex flex-col items-center justify-center",
                              "rounded-lg transition",
                              active
                                ? "bg-white text-black"
                                : "text-white/70 hover:bg-white/10 hover:text-white",
                            )}
                          >
                            <span
                              className={classNames(
                                "max-w-full truncate px-1",
                                "font-neuehaas text-xs font-medium",
                              )}
                            >
                              {s}
                            </span>
                            <span
                              className={classNames("text-[10px] opacity-60")}
                            >
                              {SITUATION_INFO[s].name}
                            </span>
                            {count > 0 && (
                              <span
                                aria-label={`${count}개 바뀜`}
                                className={classNames(
                                  "absolute top-1 right-1 size-1.5",
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
              <p
                className={classNames(
                  "rounded-lg bg-white/5 px-3 py-2",
                  "text-xs break-keep text-white/60",
                )}
              >
                <span className={classNames("font-medium text-white")}>
                  {situation} {SITUATION_INFO[situation].name}
                </span>
                {" · "}
                {SITUATION_INFO[situation].when}
              </p>
            </div>
          }
        >
          <LevaPanel
            store={situationStore}
            fill
            flat
            titleBar={false}
            theme={LEVA_THEME}
          />
        </PanelCard>
      </div>

      {/* 페이지 설명 모달 */}
      {showIntro ? (
        <div
          onClick={(event) => {
            if (event.target === event.currentTarget) closeIntro();
          }}
          className={classNames(
            "fixed inset-0 z-[60]",
            "flex items-center justify-center p-6",
            "bg-black/30 backdrop-blur-sm",
          )}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tune-intro-title"
            className={classNames(
              "max-h-full w-full max-w-lg",
              "flex flex-col gap-4 overflow-y-auto p-6",
              "rounded-3xl bg-white shadow-xl",
              "text-sm break-keep text-sub",
            )}
          >
            <h2
              id="tune-intro-title"
              className={classNames("text-lg font-medium text-main")}
            >
              Agent Tune 은 어떤 페이지인가요?
            </h2>
            <p>
              사이트 오른쪽 아래에 떠 있는{" "}
              <span className={classNames("font-medium text-main")}>
                에이전트 구
              </span>
              의 색과 움직임을 직접 조절해 보는 곳이에요. 왼쪽에서 바로 미리 볼
              수 있어요.
            </p>
            <p
              className={classNames(
                "rounded-xl bg-gray-100 px-4 py-3",
                "text-xs",
              )}
            >
              여기서 바꾼 값은 사이트에 바로 반영되지 않고,{" "}
              <span className={classNames("font-medium text-main")}>
                새로고침하면 사라져요.
              </span>{" "}
              마음에 드는 값이 나오면 꼭 파일로 받아서 보내 주세요.
            </p>
            <ol className={classNames("flex flex-col gap-3")}>
              {[
                [
                  "공통 값 (왼쪽 아래)",
                  "모든 상황의 바탕이에요. 색 · 대화 창 · 음성 반응을 먼저 정하고, 카드 오른쪽 위 '다운로드' → base.json",
                ],
                [
                  "상황별 값 (오른쪽)",
                  "상황 탭(idle · hover · thinking …)을 고르고 그 상황에서 달라지는 부분만 조절한 뒤, 카드 아래 '다운로드' → idle.json 처럼 바꾼 상황마다 따로",
                ],
                [
                  "보내기",
                  "받은 파일을 개발 담당자에게 보내면 사이트에 반영돼요. 이번에 바꾼 파일은 미리보기 위 '지금 보낼 파일' 에 모여 보여요.",
                ],
              ].map(([title, body], i) => (
                <li key={title} className={classNames("flex gap-3")}>
                  <span
                    className={classNames(
                      "size-6 shrink-0",
                      "flex items-center justify-center",
                      "rounded-full bg-black",
                      "text-xs font-medium text-white",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className={classNames("flex flex-col gap-0.5")}>
                    <span className={classNames("font-medium text-main")}>
                      {title}
                    </span>
                    <span className={classNames("text-xs")}>{body}</span>
                  </span>
                </li>
              ))}
            </ol>
            {/* 최종적으로 보내 줄 파일 (바꾼 것만) */}
            <div
              className={classNames(
                "flex flex-col gap-2",
                "rounded-xl bg-gray-100 px-4 py-3",
              )}
            >
              <p className={classNames("text-xs font-medium text-main")}>
                보내 주실 파일 (바꾼 것만)
              </p>
              <ul className={classNames("flex flex-col gap-1.5", "text-xs")}>
                <li className={classNames("flex gap-2")}>
                  <span
                    className={classNames(
                      "w-24 shrink-0",
                      "font-neuehaas font-medium text-main",
                    )}
                  >
                    base.json
                  </span>
                  공통 값 (색 · 색 영역 · 대화 창 · 음성 반응 · 따라가는 빠르기)
                </li>
                {SITUATION_GROUPS.flatMap((group) => group.items).map((s) => (
                  <li key={s} className={classNames("flex gap-2")}>
                    <span
                      className={classNames(
                        "w-24 shrink-0",
                        "font-neuehaas font-medium text-main",
                      )}
                    >
                      {s}.json
                    </span>
                    {s} {SITUATION_INFO[s].name} 상황의 값
                  </li>
                ))}
              </ul>
              <p className={classNames("text-[11px] text-mute")}>
                모두 다운로드해서 그대로 보내 주시면 돼요. 이름을 바꾸지 말아
                주세요.
              </p>
            </div>
            <button
              type="button"
              autoFocus
              onClick={closeIntro}
              className={classNames(
                "h-10 w-full",
                "rounded-xl bg-black transition hover:bg-black/80",
                "text-sm font-medium text-white",
              )}
            >
              시작하기
            </button>
          </div>
        </div>
      ) : null}

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

/** 실시간 음성 그래프 — 구가 지금 반응하는 소리 크기(0–1)를 막대로 흘려 보여 줍니다. */
function VoiceMeter({
  read,
  label,
  color,
  mic,
}: {
  /** 매 프레임 읽는 소리 크기 */
  read: () => number;
  label: string;
  color: string;
  /** listening 일 때만: 마이크 켜기 · 끄기 */
  mic?: { on: boolean; toggle: () => void };
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readRef = useRef(read);
  const colorRef = useRef(color);
  useEffect(() => {
    readRef.current = read;
    colorRef.current = color;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const COUNT = 96;
    const samples: number[] = [];
    let raf = 0;
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      samples.push(Math.max(0, Math.min(1, readRef.current())));
      if (samples.length > COUNT) samples.shift();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = colorRef.current;
      const step = w / COUNT;
      samples.forEach((v, i) => {
        const bar = Math.max(2, v * h);
        ctx.globalAlpha = 0.25 + 0.75 * (i / COUNT);
        ctx.fillRect(
          w - (samples.length - i) * step,
          (h - bar) / 2,
          Math.max(1, step - 1.5),
          bar,
        );
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={classNames(
        "mx-5 mb-2",
        "flex items-center gap-3",
        "rounded-2xl bg-gray-100 px-4 py-2.5",
      )}
    >
      <span
        className={classNames(
          "shrink-0",
          "text-xs font-medium whitespace-nowrap text-main",
        )}
      >
        {label}
      </span>
      <canvas
        ref={canvasRef}
        aria-hidden
        className={classNames("h-8 min-w-0 flex-1")}
      />
      {mic ? (
        <button
          type="button"
          aria-pressed={mic.on}
          onClick={mic.toggle}
          className={classNames(
            "h-7 px-3",
            "shrink-0",
            "rounded-full transition",
            "text-xs font-medium whitespace-nowrap",
            mic.on
              ? "bg-black text-white hover:bg-black/80"
              : "bg-white text-main hover:bg-gray-200",
          )}
        >
          {mic.on ? "마이크 끄기" : "마이크 켜기"}
        </button>
      ) : null}
    </div>
  );
}

/** 조절 패널 한 장: 번호 · 제목 · 설명 · Leva 패널 · 내보내기 버튼 */
function PanelCard({
  step,
  title,
  badge,
  description,
  file,
  onCopy,
  onDownload,
  onReset,
  lead,
  grow = false,
  actionsInHeader = false,
  changedCount = 0,
  className,
  children,
}: {
  step: number;
  title: string;
  badge: string;
  description: string;
  /** 붙여 넣을 파일 (없으면 내보내기 버튼 없음) */
  file?: string;
  onCopy?: () => void;
  onDownload?: () => void;
  onReset?: () => void;
  /** 설명 아래 · 패널 위에 넣을 것 (상황 탭) */
  lead?: React.ReactNode;
  /** 넓은 화면에서 남는 높이를 채우고 안쪽에서 스크롤 */
  grow?: boolean;
  /** 다운로드 · 복사 버튼을 아래가 아니라 제목 줄에 (높이가 낮은 카드) */
  actionsInHeader?: boolean;
  /** 파일 값과 다른 항목 수 */
  changedCount?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const action = classNames(
    "h-8 px-3",
    "rounded-lg transition",
    "text-xs font-medium whitespace-nowrap",
  );
  const actions = file ? (
    <div className={classNames("flex gap-1.5")}>
      <button
        type="button"
        onClick={onDownload}
        className={classNames(action, "bg-white text-black hover:bg-white/85")}
      >
        다운로드
      </button>
      <button
        type="button"
        onClick={onCopy}
        title={`개발용: ${file} 에 통째로 붙여 넣을 JSON`}
        className={classNames(action, "bg-white/10 hover:bg-white/20")}
      >
        JSON 복사
      </button>
      <button
        type="button"
        onClick={onReset}
        className={classNames(
          action,
          actionsInHeader ? null : "ml-auto",
          "text-white/60 hover:bg-white/10 hover:text-white",
        )}
      >
        파일 값으로 되돌리기
      </button>
    </div>
  ) : null;
  return (
    <section
      aria-label={title}
      className={classNames(
        grow ? "lg:min-h-0 lg:flex-1" : "shrink-0",
        "flex flex-col",
        "overflow-hidden rounded-2xl bg-neutral-900",
        "text-white",
        className,
      )}
    >
      <header className={classNames("flex flex-col gap-1.5 px-4 pt-4 pb-3")}>
        <div className={classNames("flex flex-wrap items-center gap-2")}>
          <span
            className={classNames(
              "size-5",
              "flex items-center justify-center",
              "rounded-full bg-white",
              "text-[11px] font-medium text-black",
            )}
          >
            {step}
          </span>
          <h2 className={classNames("text-sm font-medium")}>{title}</h2>
          <span
            className={classNames(
              actionsInHeader ? null : "ml-auto",
              "rounded-full bg-white/10 px-2 py-0.5",
              "text-[11px] text-white/55",
            )}
          >
            {badge}
          </span>
          {actionsInHeader ? (
            <div className={classNames("ml-auto", "flex items-center gap-3")}>
              <ChangedCount count={changedCount} />
              {actions}
            </div>
          ) : null}
        </div>
        <p className={classNames("text-xs break-keep text-white/60")}>
          {description}
          {actionsInHeader && file ? (
            <>
              {" "}
              다 고르면 다운로드해서{" "}
              <span className={classNames("text-white")}>
                {file.split("/").pop()}
              </span>{" "}
              을 보내 주세요.
            </>
          ) : null}
        </p>
      </header>
      {lead}
      {/* 슬라이더: 카드 안에서만 스크롤 (끝에 닿아도 페이지가 따라 내려가지 않음) */}
      <FadeScroll
        axis="y"
        className={classNames(
          "lg:min-h-0 lg:flex-1",
          "lg:overflow-y-auto lg:overscroll-contain",
          // Leva 맨 바깥 판의 배경을 지워 카드 배경 하나로 (판 색 elevation1 은 슬라이더 트랙도 써서 테마로는 못 바꿈)
          "[&>div]:bg-transparent!",
        )}
      >
        {children}
      </FadeScroll>
      {file && !actionsInHeader ? (
        <footer className={classNames("flex flex-col gap-2 px-4 pt-2 pb-4")}>
          <p
            className={classNames(
              "flex items-center gap-2",
              "text-[11px] text-white/55",
            )}
          >
            <ChangedCount count={changedCount} />다 고르면 다운로드해서{" "}
            <span className={classNames("text-white")}>
              {file.split("/").pop()}
            </span>{" "}
            을 보내 주세요
          </p>
          {actions}
        </footer>
      ) : null}
    </section>
  );
}

/** 공통 값의 한 묶음 (색 · 색 영역 · 모달 …). 묶음마다 Leva 패널을 따로 만들어 가로로 늘어놓습니다. */
function BaseGroupPanel({
  title,
  schema,
}: {
  title: string;
  schema: () => LevaSchema;
}) {
  const store = useCreateStore();
  useControls(schema as Parameters<typeof useControls>[0], { store });
  return (
    <div className={classNames("w-64 shrink-0", "flex flex-col")}>
      <p
        className={classNames(
          "px-2 pb-1",
          "text-[11px] font-medium text-white/70",
        )}
      >
        {title}
      </p>
      <FadeScroll
        axis="y"
        className={classNames(
          "min-h-0 flex-1",
          // 세로 스크롤만 이 칸에 가둠 — 좌우로 밀면 바깥 가로 줄이 넘어가도록 (가로까지 가두면 묶음 위에서 좌우 스크롤이 안 됨)
          "overflow-y-auto overscroll-y-contain",
          // Leva 맨 바깥 판의 배경을 지워 카드 배경 하나로
          "[&>div]:bg-transparent!",
        )}
      >
        <LevaPanel
          store={store}
          fill
          flat
          titleBar={false}
          theme={LEVA_THEME}
        />
      </FadeScroll>
    </div>
  );
}

/**
 * 스크롤되는 상자: 가려진 쪽 끝을 흐리게(그라데이션) 해서 "더 있어요" 를 보여 줍니다.
 * 처음엔 끝쪽(아래 · 오른쪽)만 흐리고, 스크롤하면 지나온 쪽도 흐려지며, 끝에 닿으면 그쪽 흐림이 사라집니다.
 */
function FadeScroll({
  axis,
  className,
  children,
}: {
  axis: "x" | "y";
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const start = axis === "y" ? el.scrollTop : el.scrollLeft;
      const rest =
        axis === "y"
          ? el.scrollHeight - el.clientHeight - start
          : el.scrollWidth - el.clientWidth - start;
      el.style.setProperty("--fade-start", start > 1 ? "24px" : "0px");
      el.style.setProperty("--fade-end", rest > 1 ? "48px" : "0px");
      // 좌우: 양 끝 ‹ › 버튼을 숨겨진 쪽에만 보이게
      const wrap = wrapRef.current;
      if (wrap) {
        wrap.dataset.more = [start > 1 && "start", rest > 1 && "end"]
          .filter(Boolean)
          .join(" ");
      }
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    // 폴더를 열고 닫거나 화면 크기가 바뀌면 다시 계산
    const ro = new ResizeObserver(update);
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [axis]);
  const mask = `linear-gradient(${axis === "y" ? "to bottom" : "to right"}, transparent 0, #000 var(--fade-start, 0px), #000 calc(100% - var(--fade-end, 0px)), transparent 100%)`;
  const box = (
    <div
      ref={ref}
      className={className}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      {children}
    </div>
  );
  if (axis === "y") return box;

  /** 한 화면씩 넘기기 */
  const page = (dir: 1 | -1) =>
    ref.current?.scrollBy({
      left: dir * ref.current.clientWidth * 0.8,
      behavior: "smooth",
    });
  const arrow = (dir: 1 | -1) => (
    <button
      type="button"
      aria-label={dir === 1 ? "오른쪽 묶음 보기" : "왼쪽 묶음 보기"}
      onClick={() => page(dir)}
      className={classNames(
        "size-9",
        "absolute top-1/2 z-10 flex -translate-y-1/2 items-center justify-center",
        dir === 1 ? "right-1" : "left-1",
        "pointer-events-none rounded-full bg-white opacity-0 shadow-lg transition hover:bg-gray-100",
        dir === 1
          ? "group-data-[more~=end]/fade:pointer-events-auto group-data-[more~=end]/fade:opacity-100"
          : "group-data-[more~=start]/fade:pointer-events-auto group-data-[more~=start]/fade:opacity-100",
        "text-lg text-black",
      )}
    >
      <span aria-hidden>{dir === 1 ? "›" : "‹"}</span>
    </button>
  );
  return (
    <div ref={wrapRef} className={classNames("group/fade h-full", "relative")}>
      {box}
      {arrow(-1)}
      {arrow(1)}
    </div>
  );
}

/** 바뀐 항목 수 (분홍 점) */
function ChangedCount({ count }: { count: number }) {
  return (
    <span
      className={classNames(
        "inline-flex shrink-0 items-center gap-1",
        "text-[11px] whitespace-nowrap",
        count ? "text-white" : "text-white/40",
      )}
    >
      <span
        aria-hidden
        className={classNames(
          "size-1.5",
          "rounded-full",
          count ? "bg-pink" : "bg-white/25",
        )}
      />
      바뀐 항목 {count}개
    </span>
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
