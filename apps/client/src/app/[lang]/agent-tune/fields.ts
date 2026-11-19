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
        key: "speed",
        label: "흐름 빠르기",
        hint: "시간 배속",
        min: 0,
        max: 2,
        step: 0.01,
      },
      {
        key: "energy",
        label: "진하기",
        hint: "파랑-보라 덩어리의 진하기 (0–1)",
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        key: "swirl",
        label: "소용돌이",
        hint: "가운데로 비틀리는 정도",
        min: 0,
        max: 1.5,
        step: 0.01,
      },
      {
        key: "colorOrbit",
        label: "색 회전",
        hint: "파랑 · 라벤더 영역이 도는 빠르기",
        min: 0,
        max: 2,
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
      {
        key: "morph",
        label: "일렁임",
        hint: "가장자리 흔들림 (0 = 완전한 원)",
        min: 0,
        max: 3,
        step: 0.01,
      },
    ],
  },
  {
    title: "질감",
    fields: [
      {
        key: "noiseScale",
        label: "노이즈 확대",
        hint: "낮을수록 색 덩어리가 크고 부드러움",
        min: 0.1,
        max: 2,
        step: 0.01,
      },
      {
        key: "warp1",
        label: "1차 비틀기",
        hint: "색 경계가 휘는 정도",
        min: 0,
        max: 3,
        step: 0.01,
      },
      {
        key: "warp2",
        label: "2차 비틀기",
        hint: "높을수록 액체 · 마블 느낌",
        min: 0,
        max: 3,
        step: 0.01,
      },
    ],
  },
  {
    title: "빛",
    fields: [
      {
        key: "bulge",
        label: "볼록함",
        hint: "렌즈처럼 볼록한 입체감 (0–1)",
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        key: "rim",
        label: "테두리 빛",
        hint: "가장자리 밝기",
        min: 0,
        max: 1.5,
        step: 0.01,
      },
      {
        key: "specular",
        label: "반사광",
        hint: "왼쪽 위 하이라이트",
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        key: "glow",
        label: "번짐 빛 진하기",
        hint: "바깥으로 번지는 빛 (0–1)",
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        key: "glowScale",
        label: "번짐 빛 크기",
        hint: "1 = 기본",
        min: 0.5,
        max: 2,
        step: 0.01,
      },
    ],
  },
];

export type BaseSection = "panel" | "voice" | "motion";
export const BASE_GROUPS: {
  title: string;
  section: BaseSection;
  fields: Field<string>[];
}[] = [
  {
    title: "모달(대화 창)",
    section: "panel",
    fields: [
      {
        key: "noiseScale",
        label: "노이즈 확대",
        hint: "펼쳐졌을 때 색 덩어리 크기",
        min: 0.1,
        max: 2,
        step: 0.01,
      },
      {
        key: "radius",
        label: "모서리 둥글기",
        hint: "px",
        min: 0,
        max: 60,
        step: 1,
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
        key: "levelGlow",
        label: "번짐 빛 반응",
        hint: "소리가 클수록 빛이 커지는 정도",
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        key: "levelMorph",
        label: "일렁임 반응",
        hint: "소리가 클수록 가장자리가 흔들리는 정도",
        min: 0,
        max: 4,
        step: 0.05,
      },
      {
        key: "levelBrightness",
        label: "밝기 반응",
        hint: "소리가 클수록 밝아지는 정도",
        min: 0,
        max: 0.5,
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
        label: "흐름 · 색 · 질감",
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
