@AGENTS.md

# cciD — Claude Code 작업 안내

연구실 소개 사이트(client)와 관리자(admin) 모노레포입니다. 설치 · 구조 · 색 · 폰트 · 다국어 · 권한 등 전체 설명은 [README.md](README.md)에 있고, 이 파일은 **작업할 때 꼭 지킬 규칙**만 모았습니다.

- 답변 · 코드 주석 · 문서는 한국어로 씁니다.
- 큰 작업은 한 단계씩 진행하고, 단계마다 결과를 보여 주고 확인받은 뒤 다음으로 넘어갑니다.
- 커밋 · push 는 요청받았을 때만 합니다.

## 버전 주의

학습 데이터와 다른 최신 버전입니다. 코드를 쓰기 전에 설치된 패키지의 문서를 먼저 확인하세요.

- Next.js 16 (Turbopack) — `node_modules/next/dist/docs/` · React 19 · TypeScript 7 · Tailwind CSS v4 · Turborepo 2
- Node 24 이상, Yarn 1.22.22. `yarn workspace <앱> add` 가 실패하면 해당 `package.json` 에 직접 추가하고 `yarn install` 하세요.
- `next dev` 가 `apps/client/AGENTS.md` · `CLAUDE.md` 를 자동으로 만듭니다. 지우지 말고 그대로 두세요.

## 끝내기 전 확인

```bash
yarn lint          # --max-warnings 0
yarn check-types
```

## 데이터베이스 · env

- env 는 **루트** `.env` 또는 `.env.local` 하나입니다. 절대 커밋하지 않습니다. (`.env.example` 에는 이름만)
- 로컬 개발도 **운영 Supabase** 에 붙어 있습니다. admin 에서 저장 · 삭제하면 실제 사이트 데이터가 바뀝니다.
- 스키마는 `yarn db:migration <name>` 으로 새 파일을 만들어서만 바꿉니다. 적용된 마이그레이션 파일은 고치지 않습니다. ([supabase/README.md](supabase/README.md))
- `yarn db:push`(원격 DB 반영)는 사람에게 확인받고 실행합니다.
- `SUPABASE_SECRET_KEY` 는 `import "server-only"` 파일에서만 읽습니다. `NEXT_PUBLIC_` 을 붙이지 않습니다.

## 스타일 규칙 (client)

- **Tailwind 클래스를 요소에 그대로** 씁니다. (`text-3xl md:text-4xl`)
  - 스타일을 공유하려고 CSS 변수 · 커스텀 유틸리티(`text-title`) · className 상수(`SECTION_Y`)를 만들지 않습니다. 나중에 사람이 직접 고치기 어렵습니다.
  - 예외: 애니메이션 `@keyframes`, 조절용 값 JSON 파일, 움직이는 값의 inline `style`.
- `className` 은 `classnames` 로 5개 묶음(크기 → 레이아웃 → 여백 → 배경·효과 → 글자)으로 나눠 씁니다. (README "스타일 작성 규칙")
- **`tracking-*`(자간)를 쓰지 않습니다.** 자간이 필요하면 `apps/client/src/styles/global.css` 의 `--letter-spacing-*` 한 곳에서만 바꿉니다.
- **Neue Haas 굵기는 폰트 이름 기준**입니다. (`packages/styles/src/global.css` 의 `.font-neuehaas`)
  - `font-light` 45 Light · `font-normal`(기본) 55 Roman · `font-medium` 65 Medium · `font-bold` 75 Bold
  - `font-semibold` · `font-thin` 등 다른 굵기는 쓰지 않습니다.
- **구분선(border · hairline)으로 영역을 나누지 않습니다.** 넉넉한 여백이나 배경 톤으로 나눕니다.
- 모서리: 담는 면일수록 둥글게 (패널 · 카드 `rounded-3xl` → 안의 상자 · 이미지 `rounded-2xl` → 버튼 `rounded-lg`).
- Swiper 의 CSS 는 Tailwind 레이어 밖에 있어서 Tailwind 클래스보다 셉니다. Swiper 요소의 크기 · 여백을 바꿀 때는 `w-auto!` 처럼 `!` 를 붙입니다.

## 모션 · 인터랙션 (client)

화면을 만들 때 정적인 UI로 끝내지 말고 등장 · 호버 · 스크롤 모션을 함께 제안합니다. 이미 있는 부품을 먼저 씁니다.

| 부품            | 위치                                   | 쓰는 곳                                                                                             |
| --------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `InView`        | `components/content/InView.tsx`        | 화면에 들어오면 아래에서 떠오르며 나타남 (motion/react). `as` · `delay` · `y`                       |
| `RevealItem`    | `components/content/RevealItem.tsx`    | 목록 항목이 무작위 같은 순서로 천천히 나타남 (People)                                               |
| `Reveal`        | `components/content/Reveal.tsx`        | CSS 로 만든 등장 상자 (예전 부품, 일부 화면에서 사용)                                               |
| `TypedText`     | `components/content/TypedText.tsx`     | 타이핑 효과 (홈 랩 이름만. 많이 쓰지 않습니다)                                                      |
| `CustomCursor`  | `components/CustomCursor.tsx`          | 요소에 `cursor-label="설명"` 을 달면 커서 아래에 설명이 뜹니다                                      |
| `PageVeil`      | `components/PageVeil.tsx`              | 페이지 이동 때 유리 베일. `app/[lang]/loading.tsx` 의 `data-page-loading` 이 사라질 때까지 덮습니다 |
| `ImageCarousel` | `components/content/ImageCarousel.tsx` | Swiper 가로 캐러셀 (화면 끝까지, 좌우 커서 prev/next)                                               |

- 애니메이션 라이브러리: `motion`(motion/react), `swiper`, `react-type-animation`. 새 라이브러리를 넣기 전에 물어봅니다.
- 움직임 줄이기(`prefers-reduced-motion`) 설정이면 움직임 없이 바로 보이게 합니다.

## 배경 그래픽 조절

홈 히어로 · 푸터 배경은 WebGPU/WebGL 셰이더이고, 값은 JSON 파일에 있습니다. 숫자를 코드에서 직접 고치지 말고 조절 페이지를 씁니다.

| 페이지 (dev)   | 값 파일                                                               |
| -------------- | --------------------------------------------------------------------- |
| `/hero-tune`   | `apps/client/src/components/home/hero-background.json`                |
| `/footer-tune` | `apps/client/src/components/footer-background/footer-background.json` |
| `/agent-tune`  | 에이전트 구 — `apps/client/src/components/agent-blob/README.md` 참고  |

패널(Leva)에서 조절한 뒤 'JSON 복사'로 값 파일에 통째로 붙여 넣습니다.

## 보이스 에이전트 (대화)

구조 · 파일은 `apps/client/src/components/agent-blob/README.md` "대화"에 있습니다.

- 외부 API(OpenAI · ElevenLabs)를 부르는 것은 서버 `app/api/talk/*` 뿐입니다. 키는 `libs/talk/env.ts` 로만 읽고, 브라우저 코드로 옮기지 않습니다.
- 돈이 드는 경로를 늘릴 때는 `guard()`(봇 · 통행증 · 횟수) 와 하루 한도(`libs/talk/usage.ts`)를 함께 거치게 합니다.
- 에이전트가 아는 내용은 DB(admin)와 `talk/answers.ts`(정해 둔 대답) 뿐입니다. 사실을 프롬프트에 직접 적지 않습니다.
- 화면만 고칠 때는 `.env.local` 에 `TALK_FAKE=1` 을 넣어 연습용 대답으로 확인합니다 (비용 0).

## 피드백 코멘트 반영

사이트 위에서 남긴 코멘트는 루트 `.feedback/comments.json` 에 있습니다. (README "사이트 위 피드백 코멘트") "피드백 반영해줘" 라고 하면:

- `status: "open"` 인 코멘트만 처리합니다. `page` (주소창 경로, 한국어는 `/ko` 없이) → `app/[lang]/…`, `target.components` (안쪽 → 바깥) · `target.text` · `target.selector` 로 고칠 코드를 찾습니다. `viewport` 너비로 모바일 · 데스크톱 중 어느 화면 얘기인지 봅니다.
- 고친 뒤 그 코멘트의 `status` 를 `"done"` 으로, `note` 에 무엇을 바꿨는지 한 줄(한국어)을 적습니다. 코멘트를 지우거나 `comment` 를 바꾸지 않습니다.
- 뜻이 애매하거나 큰 변경이면 고치지 말고 `open` 으로 두고 물어봅니다.
- 이 파일은 커밋하지 않습니다. (`.gitignore`) 끝나면 `yarn lint` · `yarn check-types` 를 돌립니다.

## 하지 말 것

- 확인용 스크린샷 · 임시 파일을 레포 안에 저장하지 않습니다. (레포가 public 입니다)
- 키 · 토큰 · 비밀번호를 코드나 문서에 적지 않습니다.

## 커밋 메시지

`[style]` · `[fix]` · `[feature]` 뒤에 영어 소문자로 짧게 씁니다. 예: `[style]update feedback-3`, `[fix]fix cursor position when scrolling`
