# AgentBlob

에이전트 구(blob). 공통 레이아웃(`components/Layout.tsx`) 오른쪽 아래에 떠 있고, 누르면 대화 창으로 펼쳐집니다.

```tsx
<AgentBlob />                                                // design 모드 (기본): 올림 · 누름 반응만
<AgentBlob mode="agent" labels={dict.agent} lang={locale} /> // agent 모드: 누르면 대화 창 (글 · 목소리 대화)
<AgentBlob voice />                                          // design 모드에서 실제 마이크 반응 켜기 (기본 꺼짐)
```

## 파일

| 위치                    | 하는 일                                                                                       | 언제 여나                                          |
| ----------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `AgentBlob.tsx`         | 화면에 넣는 컴포넌트 (design · agent 모드, 대화 창 열고 닫기 · 크기 `PANEL`)                  | 쓰는 법 · 창 크기를 바꿀 때                        |
| `TalkPanel.tsx`         | 대화 창 내용 (쌓이는 대화 · 미리보기 카드 · 추천 질문 · 입력 줄 · 마이크 안내 카드)           | 대화 창 화면을 바꿀 때                             |
| `talk/`                 | 대화 기능 (아래 "대화" 참고)                                                                  |                                                    |
| `presets/*.json`        | 상황별 디자인 값 (`idle` `hover` `press` `listening` `thinking` `speaking`) + 공통 값(`base`) | 값을 바꿀 때 — `/agent-tune` 에서 복사해 붙여 넣기 |
| `engine/`               | 그리는 원리. 보통은 열지 않아도 됩니다.                                                       |                                                    |
| ├ `config.ts`           | 값의 모양(타입) · presets 합치기                                                              | 조절할 값을 새로 추가할 때                         |
| ├ `renderer.ts`         | 상황별 값을 부드럽게 옮기기 · 올림 · 누름 · 음성 반응 · 펼칠 때 구 크기                       | 상황 전환 · 반응 방식을 바꿀 때                    |
| ├ `flow-orb.ts`         | flow 구 그리기 (Three.js). 보내주신 flow cursor 를 그대로 옮긴 것                             | 그림 자체를 바꿀 때                                |
| ├ `flow-orb-shaders.ts` | flow cursor 셰이더 원문 (원본 `flow-cursor.js` 에서 자동으로 꺼냄, 원본은 레포에 없음)        |                                                    |
| ├ `BlobCanvas.tsx`      | 캔버스 React 래퍼 (CSS 대체 화면 · 펼친 창 모양으로 자르기 · 흰 덮개)                         |                                                    |
| └ `useMicLevel.ts`      | 마이크 소리 크기 (design 모드에서 voice 를 켤 때만)                                           |                                                    |

튜닝 페이지 `/agent-tune` 은 페이지 옆에 있습니다: `app/[lang]/agent-tune/`

- `AgentTuner.tsx` — 화면 · 스타일
- `fields.ts` — 조절 항목의 이름 · 설명 · 범위, 상황 설명

## 그림

보내주신 flow cursor(Three.js 구 + 셰이더)를 그대로 씁니다. 원본에서 뺀 것은 마우스 따라가기 · 꼬리뿐이고, 값 이름도 원본 `flow-cursor.json` 을 따릅니다.

- 상황별 값(`presets/<상황>.json`): 흐름 빠르기(`spin`) · 움직임 세기(`boost`) · 채도 · 대비(`intensity`) · 빛 · 빛번짐 · 밝기 · 부드러움 · 불규칙함 · 물결 크기 · 크기 · 숨쉬기
- 공통 값(`presets/base.json`): 색 5개 · 색 영역 · 불투명도 · 물결 속도 · 스타일(`flow`), 대화 창(`panel`), 열고 닫는 모션(`morph`), 음성 반응(`voice`), 따라가는 빠르기(`motion`)
- 대화 창으로 열 때는 구가 직접 창 모양으로 바뀝니다(모핑). 열려 있는 동안 캔버스가 화면 전체를 덮고, 모양 셰이더(`flow-orb.ts` 의 `MASK_FRAGMENT`)가 원 → 둥근 사각형 · 떠난 자리와 이어지는 끈적한 목 · 방향으로 늘어남 · 젤리 출렁임 · 흰 덮개(`panel.veil`) · 가장자리 빛을 그립니다. 위치 · 크기는 스프링(`renderer.ts`)으로 움직이고, 값은 공통 값 `morph`(튜닝 페이지 "열고 닫는 모션")입니다.
- 창 크기는 `AgentBlob.tsx` 의 보이지 않는 자리 요소(`targetRef`)의 Tailwind 클래스로 정합니다. (`w-[74vw] h-[74dvh]` — 같은 비율이면 브라우저 비율을 따름)

## 대화

예전 사이트(ccid-current)의 "Let's talk" 에이전트를 옮긴 것입니다. 받아 적기 → 대답 → 목소리, 세 단계를 이어 붙인 구조입니다.

```
[브라우저 talk/]                      [서버 app/api/talk/ · libs/talk/]        [외부]
마이크 → 음성 감지(voice.ts) → 말 구간 ──▶ listen ──────────────────────────▶ ElevenLabs 받아 적기
입력 줄 · 받아 적은 말 · 대화 기록 ─────▶ chat (규칙 + 정해 둔 대답 + DB 사실) ─▶ OpenAI
  ◀── 대답이 한 조각씩 (문장 단위로 끊음)
문장 하나 ──────────────────────────────▶ speak ───────────────────────────────▶ ElevenLabs 목소리
  ◀── 소리 + 글자별 시각 → 이어서 틀고, 들리는 만큼 글자를 드러냄
```

| 위치                     | 하는 일                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `talk/chat.ts`           | 대화 흐름 (차례 · 끼어들기 · 맞장구 · 마이크 켜고 끄기). 대화는 브라우저 메모리에만 있음   |
| `talk/voice.ts`          | 소리 재생 · 마이크 · 음성 감지(Silero VAD, 마이크를 켤 때만 CDN 에서 불러옴) · 감도 `TUNE` |
| `talk/answers.ts`        | **정해 둔 대답 14개 · 추천 질문 버튼** — 서버(에이전트 규칙)와 화면이 같이 씀              |
| `talk/greeting.json`     | 첫 인사 문구                                                                               |
| `talk/human.ts`          | 사람 신호 모으기 (커서 · 스크롤 · 타자의 통계만) → 통행증 받기                             |
| `talk/humanScore.ts`     | 사람인지 판정 (브라우저 · 서버 같이 씀)                                                    |
| `public/talk/*.mp3`      | 맞장구 · 생각 소리 (예전 사이트에서 만든 것)                                               |
| `libs/talk/knowledge.ts` | 에이전트가 아는 사실 — DB(테마 · 프로젝트 · 사람 · 모집)와 화면 문구에서 1분마다 만듦      |
| `libs/talk/prompt.ts`    | 말투 · 규칙 · 도구(문의 미리보기 · 보내기)                                                 |
| `libs/talk/inquiry.ts`   | 문의 저장 (Supabase `inquiries` → admin Inquiries)                                         |
| `libs/talk/guard.ts`     | 같은 사이트 · 봇 차단 · 통행증 · 횟수 한도 (방문자 · IP)                                   |
| `libs/talk/usage.ts`     | 사이트 전체 하루 한도 (Supabase `talk_usage`)                                              |
| `libs/talk/env.ts`       | 키 · 모델 설정 (루트 `.env.example` 의 "보이스 에이전트")                                  |

- 에이전트는 학습하지 않습니다. 대화마다 규칙 · 정해 둔 대답 · 사실(약 7,200 토큰)을 함께 보내고, 앞부분이 같으면 OpenAI 캐시 할인을 받습니다. 사실을 고치려면 admin 에서 고치면 됩니다(1분 안에 반영).
- 목소리로 대답하는 것은 마이크를 켰을 때만입니다. 글로 대화하면 ElevenLabs 를 부르지 않습니다.
- 추천 질문 중 정해 둔 대답이 있는 것은 서버를 부르지 않고 바로 보여 줍니다(비용 0).
- 개발 서버에서 `TALK_FAKE=1` 이면 OpenAI · 받아 적기 대신 연습용 대답 · 문장이 나옵니다.
