# AgentBlob

에이전트 구(blob). 헤더 오른쪽에 들어가 있습니다.

```tsx
<AgentBlob />                                   // design 모드 (기본): 올림 · 누름 반응만
<AgentBlob mode="agent" labels={dict.agent} />  // agent 모드: 누르면 대화 창(모달)
<AgentBlob voice />                             // 실제 음성 인식 켜기 (기본 꺼짐)
```

## 파일

| 위치               | 하는 일                                                                                       | 언제 여나                                          |
| ------------------ | --------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `AgentBlob.tsx`    | 화면에 넣는 컴포넌트 (design · agent 모드, 대화 창)                                           | 쓰는 법 · 대화 창을 바꿀 때                        |
| `presets/*.json`   | 상황별 디자인 값 (`idle` `hover` `press` `listening` `thinking` `speaking`) + 공통 값(`base`) | 값을 바꿀 때 — `/agent-tune` 에서 복사해 붙여 넣기 |
| `engine/`          | 그리는 원리. 보통은 열지 않아도 됩니다.                                                       |                                                    |
| ├ `config.ts`      | 값의 모양(타입) · presets 합치기                                                              | 조절할 값을 새로 추가할 때                         |
| ├ `renderer.ts`    | WebGL 셰이더 · 매 프레임 값 옮기기                                                            | 그림 자체를 바꿀 때                                |
| ├ `BlobCanvas.tsx` | 캔버스 React 래퍼 (CSS 대체 화면 · 번짐 빛)                                                   |                                                    |
| └ `useMicLevel.ts` | 마이크 소리 크기 (voice 를 켤 때만)                                                           |                                                    |

튜닝 페이지 `/agent-tune` 은 페이지 옆에 있습니다: `app/[lang]/agent-tune/`

- `AgentTuner.tsx` — 화면 · 스타일
- `fields.ts` — 조절 항목의 이름 · 설명 · 범위, 상황 설명
