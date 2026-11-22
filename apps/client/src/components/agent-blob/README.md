# AgentBlob

에이전트 구(blob). 헤더 오른쪽에 들어가 있습니다.

```tsx
<AgentBlob />                                   // design 모드 (기본): 올림 · 누름 반응만
<AgentBlob mode="agent" labels={dict.agent} />  // agent 모드: 누르면 대화 창(모달)
<AgentBlob voice />                             // 실제 음성 인식 켜기 (기본 꺼짐)
```

## 파일

| 위치                    | 하는 일                                                                                       | 언제 여나                                          |
| ----------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `AgentBlob.tsx`         | 화면에 넣는 컴포넌트 (design · agent 모드, 대화 창)                                           | 쓰는 법 · 대화 창을 바꿀 때                        |
| `presets/*.json`        | 상황별 디자인 값 (`idle` `hover` `press` `listening` `thinking` `speaking`) + 공통 값(`base`) | 값을 바꿀 때 — `/agent-tune` 에서 복사해 붙여 넣기 |
| `engine/`               | 그리는 원리. 보통은 열지 않아도 됩니다.                                                       |                                                    |
| ├ `config.ts`           | 값의 모양(타입) · presets 합치기                                                              | 조절할 값을 새로 추가할 때                         |
| ├ `renderer.ts`         | 상황별 값을 부드럽게 옮기기 · 올림 · 누름 · 음성 반응 · 펼칠 때 구 크기                       | 상황 전환 · 반응 방식을 바꿀 때                    |
| ├ `flow-orb.ts`         | flow 구 그리기 (Three.js). 보내주신 flow cursor 를 그대로 옮긴 것                             | 그림 자체를 바꿀 때                                |
| ├ `flow-orb-shaders.ts` | flow cursor 셰이더 원문 (원본 `flow-cursor.js` 에서 자동으로 꺼냄, 원본은 레포에 없음)        |                                                    |
| ├ `BlobCanvas.tsx`      | 캔버스 React 래퍼 (CSS 대체 화면 · 펼친 창 모양으로 자르기 · 흰 덮개)                         |                                                    |
| └ `useMicLevel.ts`      | 마이크 소리 크기 (voice 를 켤 때만)                                                           |                                                    |

튜닝 페이지 `/agent-tune` 은 페이지 옆에 있습니다: `app/[lang]/agent-tune/`

- `AgentTuner.tsx` — 화면 · 스타일
- `fields.ts` — 조절 항목의 이름 · 설명 · 범위, 상황 설명

## 그림

보내주신 flow cursor(Three.js 구 + 셰이더)를 그대로 씁니다. 원본에서 뺀 것은 마우스 따라가기 · 꼬리뿐이고, 값 이름도 원본 `flow-cursor.json` 을 따릅니다.

- 상황별 값(`presets/<상황>.json`): 흐름 빠르기(`spin`) · 움직임 세기(`boost`) · 채도 · 대비(`intensity`) · 빛 · 빛번짐 · 밝기 · 부드러움 · 불규칙함 · 물결 크기 · 크기 · 숨쉬기
- 공통 값(`presets/base.json`): 색 5개 · 색 영역 · 불투명도 · 물결 속도 · 스타일(`flow`), 대화 창(`panel`), 음성 반응(`voice`), 따라가는 빠르기(`motion`)
- 대화 창으로 펼치면 구가 창 대각선 × `panel.fill` 크기로 커지고 창 모양으로 잘립니다. 글자가 잘 보이도록 흰 덮개(`panel.veil`)를 얹습니다.
