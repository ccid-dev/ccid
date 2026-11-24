// /agent-tune 튜닝 화면의 내용: 상황 설명 · 조절 항목(이름 · 설명 · 범위).
// 슬라이더 범위나 설명 문구를 바꿀 때는 이 파일만 고치면 됩니다. (화면 · 스타일은 AgentTuner.tsx)

import type { BlobPreset, BlobSituation } from "@/components/agent-blob";

/** 상황 이름 · 언제인지 */
export const SITUATION_INFO: Record<
  BlobSituation,
  { name: string; when: string }
> = {
  idle: {
    name: "기본",
    when: "아무 동작이 없을 때의 평소 모습이에요. 헤더에 떠 있는 기본 상태예요.",
  },
  hover: {
    name: "올림",
    when: "마우스를 구 위에 올렸을 때예요. 닫혀 있는 구에서만 보여요.",
  },
  press: {
    name: "누름",
    when: "구를 누르고 있는 동안이에요. 손을 떼면 hover 로 돌아가요.",
  },
  listening: {
    name: "듣기",
    when: "대화 창을 열면 처음 되는 상태예요. 사용자의 말을 듣는 중이고, 목소리 크기에 반응해요.",
  },
  thinking: {
    name: "생각",
    when: "사용자가 말을 마치고 에이전트가 답을 준비하는 동안이에요.",
  },
  speaking: {
    name: "말하기",
    when: "에이전트가 답을 말하는 동안이에요. 에이전트 목소리 크기에 반응해요.",
  },
};

/** 상황 탭 묶음: 언제 쓰이는지 */
export const SITUATION_GROUPS: { title: string; items: BlobSituation[] }[] = [
  { title: "닫힌 구 · 손으로 건드릴 때", items: ["idle", "hover", "press"] },
  {
    title: "대화 창 · 대화할 때",
    items: ["listening", "thinking", "speaking"],
  },
];

export type Field<K extends string> = {
  key: K;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
};

export const PRESET_GROUPS: {
  title: string;
  fields: Field<keyof BlobPreset>[];
}[] = [
  {
    title: "흐름",
    fields: [
      {
        key: "spin",
        label: "흐름 빠르기",
        hint: "시간 배속 (원본 spin)",
        min: 0,
        max: 3,
        step: 0.01,
      },
      {
        key: "boost",
        label: "움직임 세기",
        hint: "물결 · 색 움직임 (0 = 거의 멈춤)",
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        key: "flowScale",
        label: "물결 크기",
        hint: "",
        min: 0.15,
        max: 4,
        step: 0.01,
      },
    ],
  },
  {
    title: "모양",
    fields: [
      {
        key: "scale",
        label: "크기",
        hint: "1 = 원래 크기",
        min: 0.5,
        max: 1.5,
        step: 0.01,
      },
      {
        key: "breathe",
        label: "숨쉬기",
        hint: "커졌다 작아지는 폭",
        min: 0,
        max: 0.1,
        step: 0.001,
      },
    ],
  },
  {
    title: "질감",
    fields: [
      {
        key: "softness",
        label: "부드러움",
        hint: "색 경계가 녹아드는 정도",
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        key: "colorRandom",
        label: "불규칙함",
        hint: "색 경계가 흐트러지는 정도",
        min: 0,
        max: 1,
        step: 0.01,
      },
    ],
  },
  {
    title: "빛",
    fields: [
      {
        key: "intensity",
        label: "채도 · 대비",
        hint: "0 = 원본 cursor",
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        key: "brightness",
        label: "밝기",
        hint: "",
        min: 0.5,
        max: 1.6,
        step: 0.01,
      },
      {
        key: "glow",
        label: "빛",
        hint: "테두리 · 안쪽 빛",
        min: 0,
        max: 2.2,
        step: 0.01,
      },
      {
        key: "haze",
        label: "빛번짐",
        hint: "구 둘레",
        min: 0,
        max: 1.5,
        step: 0.01,
      },
    ],
  },
];

export type BaseSection = "flow" | "panel" | "morph" | "voice" | "motion";
export const BASE_GROUPS: {
  title: string;
  section: BaseSection;
  fields: Field<string>[];
}[] = [
  {
    title: "색 영역",
    section: "flow",
    fields: [
      {
        key: "areaA",
        label: "위 색 넓이",
        hint: "",
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        key: "areaB",
        label: "아래 색 넓이",
        hint: "",
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        key: "areaC",
        label: "옆 색 넓이",
        hint: "",
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        key: "areaWarm",
        label: "가운데 색 넓이",
        hint: "",
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        key: "areaRim",
        label: "테두리 색 세기",
        hint: "",
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        key: "opacity",
        label: "불투명도",
        hint: "",
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        key: "flowSpeed",
        label: "물결 속도",
        hint: "원본 flowSpeed",
        min: 0,
        max: 1.28,
        step: 0.01,
      },
    ],
  },
  {
    title: "모달(대화 창)",
    section: "panel",
    fields: [
      {
        key: "radius",
        label: "모서리 둥글기",
        hint: "px",
        min: 0,
        max: 60,
        step: 1,
      },
      {
        key: "fill",
        label: "구 크기",
        hint: "창 대각선 대비 지름",
        min: 0.5,
        max: 3,
        step: 0.01,
      },
      {
        key: "veil",
        label: "흰 덮개",
        hint: "글자가 잘 보이도록 (0–1)",
        min: 0,
        max: 1,
        step: 0.01,
      },
    ],
  },
  {
    title: "열고 닫는 모션 (구 ↔ 대화 창)",
    section: "morph",
    fields: [
      {
        key: "stiffness",
        label: "날아가는 빠르기",
        hint: "위치 스프링 단단함 — 클수록 빨리 가운데로",
        min: 40,
        max: 600,
        step: 5,
      },
      {
        key: "damping",
        label: "도착할 때 멈춤",
        hint: "위치 스프링 감쇠 — 작을수록 도착해서 출렁임",
        min: 4,
        max: 60,
        step: 0.5,
      },
      {
        key: "sizeStiffness",
        label: "퍼지는 빠르기",
        hint: "크기 스프링 단단함 — 위치보다 작으면 물방울이 먼저 끌려 나온 뒤 퍼짐",
        min: 40,
        max: 600,
        step: 5,
      },
      {
        key: "sizeDamping",
        label: "말랑함",
        hint: "크기 스프링 감쇠 — 작을수록 크기가 말랑하게 출렁임",
        min: 4,
        max: 60,
        step: 0.5,
      },
      {
        key: "stretch",
        label: "늘어남",
        hint: "움직이는 방향으로 늘어나는 정도 (squash & stretch)",
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        key: "wobble",
        label: "젤리 출렁임",
        hint: "가장자리가 출렁이는 정도",
        min: 0,
        max: 1.5,
        step: 0.01,
      },
      {
        key: "neck",
        label: "끈적한 목",
        hint: "떠난 자리와 이어지는 목의 굵기 (px, 0 = 없음)",
        min: 0,
        max: 160,
        step: 1,
      },
      {
        key: "edge",
        label: "가장자리 빛",
        hint: "창 가장자리 안쪽이 밝아지는 정도",
        min: 0,
        max: 1,
        step: 0.01,
      },
    ],
  },
  {
    title: "음성 반응 (listening · speaking)",
    section: "voice",
    fields: [
      {
        key: "levelScale",
        label: "크기 반응",
        hint: "소리가 클수록 커지는 정도",
        min: 0,
        max: 0.5,
        step: 0.005,
      },
      {
        key: "levelHaze",
        label: "빛번짐 반응",
        hint: "소리가 클수록 빛번짐이 커지는 정도",
        min: 0,
        max: 1.5,
        step: 0.01,
      },
      {
        key: "levelBrightness",
        label: "밝기 반응",
        hint: "소리가 클수록 밝아지는 정도",
        min: 0,
        max: 0.5,
        step: 0.01,
      },
      {
        key: "levelIntensity",
        label: "채도 반응",
        hint: "소리가 클수록 채도 · 대비가 올라가는 정도",
        min: 0,
        max: 1,
        step: 0.01,
      },
    ],
  },
  {
    title: "따라가는 빠르기",
    section: "motion",
    fields: [
      {
        key: "ease",
        label: "흐름 · 빛 · 질감",
        hint: "상황이 바뀔 때 (클수록 빠릿함)",
        min: 0.5,
        max: 20,
        step: 0.1,
      },
      {
        key: "scaleEase",
        label: "크기",
        hint: "상황이 바뀔 때 (클수록 빠릿함)",
        min: 1,
        max: 30,
        step: 0.5,
      },
    ],
  },
];
