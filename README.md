# cciD

**cciD (Center for Creative Intelligence Design)**: 컴퓨테이셔널 디자인과 생성형 AI를 바탕으로 사용자 경험을 연구하고 디자인하는 인간 중심의 디자인 센터입니다.

연구실 사이트(`client`)와 관리자(`admin`)입니다. 두 앱이 블록·스타일·공용 컴포넌트를 공유하는 Next.js · Supabase 기반 Turborepo 모노레포입니다.
콘텐츠(리서치 분야 · 프로젝트 · 구성원)는 Supabase에 저장하고, admin에서 승인된 계정이 관리합니다.

- **Supabase**: 데이터 저장 (Postgres + RLS). 스키마는 `supabase/migrations`에 추가합니다.
- **Supabase Storage**: 이미지 저장 (`media` 공개 버킷)

## 시작하기

요구 사항: Node.js 24 이상, Yarn 1.22.22, Supabase CLI (로컬 DB를 쓸 경우 Docker)

```bash
yarn install
cp .env.example .env.local   # 필요한 키 채우기 (전달받은 env 파일이 있으면 루트에 .env 또는 .env.local 로 두기)
yarn dev
```

- Client: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3001](http://localhost:3001) — `/signup` 으로 가입한 뒤 메인테이너가 승인하면 들어갈 수 있습니다.

> **주의:** env 에 원격(운영) Supabase 주소를 넣으면 로컬 개발도 실제 DB를 씁니다. admin 에서 저장 · 삭제하면 사이트에 바로 반영됩니다. 따로 연습하려면 아래 로컬 Supabase 를 쓰세요.

### 협업

- Claude Code 로 작업하면 루트 [CLAUDE.md](CLAUDE.md)의 규칙(스타일 · 모션 · DB 주의사항)을 자동으로 읽습니다. 사람도 작업 전에 한 번 읽어 주세요.
- 끝내기 전에 `yarn lint` · `yarn check-types` 를 통과시킵니다.
- 커밋 메시지: `[style]` · `[fix]` · `[feature]` 뒤에 영어 소문자로 짧게. 예: `[fix]fix cursor position when scrolling`
- 레포는 public 입니다. env · 키 · 확인용 스크린샷을 커밋하지 마세요.

### Supabase 연결

```bash
yarn db:start     # 로컬 Supabase 실행 → 출력된 URL / Publishable key 를 .env.local 에
yarn db:reset     # supabase/migrations 전체 + seed.sql 적용
```

원격 프로젝트는 `supabase link --project-ref <ref>` 후 `yarn db:push`로 마이그레이션을 반영합니다.
스키마 관리 규칙은 [supabase/README.md](supabase/README.md)를 참고하세요.

### 이미지 (Supabase Storage)

이미지는 Supabase Storage의 `media` 공개 버킷에 저장합니다. 버킷과 업로드 권한은 마이그레이션(`create_media_bucket`)이 만듭니다.

- admin에서 올린 이미지는 `themes/<uuid>.webp`, `people/<uuid>.webp` 같은 **키**로 DB에 저장됩니다.
- **업로드 때 최적화** (`apps/admin/src/libs/upload.ts`, 브라우저에서 처리)
  - **WebP (기본)**: 긴 변 2400px 이하로 줄이고 WebP(품질 0.82)로 저장합니다. 투명 배경도 유지됩니다.
  - **PNG**: 로고 · 스티커처럼 PNG로 둬야 하는 이미지. 크기만 줄이고 PNG 그대로 저장합니다.
  - **GIF**: 움직이는 이미지. 원본 그대로 저장합니다.
- 화면에서는 `libs/media.ts`의 `mediaUrl(key)`로 공개 주소를 만들고 일반 `<img>`로 보여줍니다. (이미 최적화된 이미지라 `next/image`를 쓰지 않습니다)
- **다른 저장소로 옮길 때:** 같은 키로 파일을 복사하고 `NEXT_PUBLIC_MEDIA_URL`에 새 공개 주소를 넣으면 화면 쪽은 끝납니다. admin 업로드(`libs/upload.ts`)만 새 저장소 방식으로 바꾸면 됩니다.
- admin에서 이미지를 목록에서 빼도 저장소의 파일은 지워지지 않습니다.

## 환경변수

모든 env는 **루트 `.env.local` 하나**로 관리합니다. 루트 `next.config.base.mjs`가 루트 env 파일을 읽습니다. 항목 설명은 [.env.example](.env.example)에 있습니다.

| 변수                                                               | 사용처 | 비고                                                                 |
| ------------------------------------------------------------------ | ------ | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                                             | client | canonical, sitemap, OG 기준 도메인. 배포 빌드에서 비어 있으면 경고   |
| `GOOGLE_SITE_VERIFICATION`, `NAVER_SITE_VERIFICATION`              | client | 검색엔진 소유 확인 (선택)                                            |
| `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GA_ID`                          | client | Google Tag Manager / Analytics (선택)                                |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 공통   | 공개 키 (RLS 적용)                                                   |
| `SUPABASE_SECRET_KEY`                                              | admin  | 비밀 키. 메인테이너의 비밀번호 재설정에만 사용 (`NEXT_PUBLIC_` 금지) |
| `NEXT_PUBLIC_MEDIA_URL`                                            | 공통   | (선택) 이미지 공개 주소. 비우면 Supabase Storage `media` 버킷        |

`NEXT_PUBLIC_*`는 빌드할 때 코드에 박히므로, 값을 바꾸면 다시 빌드해야 합니다. 개발 중에는 dev 서버를 다시 시작하세요.

## 프로젝트 구조

```text
apps/
├─ client/                  # 공개 사이트 (SEO 포함)
└─ admin/                   # 관리자
packages/
├─ blocks/                  # 포스트 블록: 블록 타입 + BlockRenderer
├─ styles/                  # 색 · 폰트 체계 (global.css 의 @theme)
└─ common/                  # 두 앱 공통 컴포넌트: Button · Spinner · LoadingOverlay · Container · ThemeDot
supabase/
├─ config.toml
├─ migrations/              # 스키마 변경 이력 (append-only)
└─ seed.sql
next.config.base.mjs        # 두 앱 공통 Next 설정 (env 로드, svgr, 보안 헤더)
tsconfig.base.json          # 공통 TypeScript 설정
eslint.config.mjs           # 공통 ESLint 설정
```

두 앱은 같은 폴더 구조를 따릅니다. (sitemap · JsonLd · seo 는 client만)

```text
apps/<app>/
├─ public/
│  ├─ fonts/                # next/font/local 로 읽는 폰트 (PretendardVariable.woff2)
│  ├─ icons/                # 파비콘 · 앱 아이콘 · OG 이미지
│  └─ img/
└─ src/
   ├─ app/                  # layout · loading · not-found · page · manifest.json · robots · sitemap
   │                        #   client 는 페이지가 app/[lang]/ 아래 (언어별 주소)
   ├─ components/           # Layout · Header · Footer (앱마다 따로), JsonLd, index.ts
   ├─ config/               # env → 설정, APP_INFO(사이트 정보)
   ├─ constants/            # 경로 등
   ├─ libs/                 # supabase 클라이언트, media(이미지 주소), seo
   ├─ styles/global.css
   ├─ theme/                # 폰트, 색상 (색상 원본은 packages/styles)
   ├─ types/                # database.ts(Supabase 생성 타입), svg.d.ts
   ├─ i18n/                 # client 만: 언어 설정 · 화면 문구(dictionaries) · 한/영 칸 선택
   ├─ proxy.ts              # client 만: 한국어 주소(언어 없음) → 안에서 [lang]=ko 로 연결
   ├─ hooks/
   └─ utils/
```

### import 경로

```ts
import { Layout } from "@/components"; // src/*
import Logo from "@/public/img/logo.svg"; // public/*
import { Container } from "@repo/common"; // packages
import { colors } from "@repo/styles";
```

SVG는 `@svgr/webpack`(Turbopack 로더)으로 React 컴포넌트가 됩니다.

```tsx
<Logo className="h-6 w-auto" />
```

### 스타일 작성 규칙

CSS 파일에 스타일을 쓰지 않고 Tailwind 클래스만 씁니다. 스타일을 공유하려고 CSS 변수 · 커스텀 유틸리티(`text-title`) · className 상수를 만들지 않고, 필요한 곳마다 클래스를 그대로 씁니다. (예외: `@keyframes`, 조절용 값 JSON, 움직이는 값의 inline `style`)

모든 태그의 `className`은 [`classnames`](https://github.com/JedWatson/classnames)로 **5개 묶음을 이 순서대로** 나눠 씁니다. 해당하는 클래스가 없는 묶음은 생략합니다.

```tsx
import classNames from "classnames";

<div
  className={classNames(
    "h-14 w-full", // 1. 크기: w · h · size · min/max · basis · shrink · aspect
    "flex items-center justify-between gap-6", // 2. 레이아웃: display · flex/grid · 정렬 · gap · position · z · overflow
    "px-5 sm:px-8", // 3. 여백: padding · margin
    "border-b bg-paper backdrop-blur", // 4. 배경·효과: bg · border · rounded · shadow · blur · opacity · transition
    "text-sm font-medium text-sub", // 5. 글자: text · font · leading · whitespace
  )}
/>;
```

- 반응형 · 상태 변형(`sm:` `hover:` `disabled:`)은 원래 클래스의 묶음에 넣습니다.
- 조건부 클래스는 해당 묶음 안에서 배열 · 객체로 씁니다. `["text-sm", { "font-semibold": active }]`
- 컴포넌트가 밖에서 `className`을 받으면 맨 뒤에 붙입니다. `classNames(..., className)`
- **자간(`tracking-*`)은 쓰지 않습니다.** 디자인에 자간이 없습니다. 필요하면 `apps/client/src/styles/global.css` 의 `--letter-spacing-pretendard` · `--letter-spacing-neuehaas` 한 곳에서 바꿉니다.
- Swiper 의 CSS 는 Tailwind 레이어 밖에 있어 Tailwind 클래스보다 셉니다. Swiper 요소의 크기 · 여백은 `w-auto!` 처럼 `!` 를 붙여 덮습니다.

### 폰트

| 클래스            | 폰트                         | 용도                         | 불러오는 곳                                  |
| ----------------- | ---------------------------- | ---------------------------- | -------------------------------------------- |
| `font-pretendard` | Pretendard Variable (45–920) | 본문·설명 등 한글 (**기본**) | `public/fonts` + `next/font/local`           |
| `font-neuehaas`   | Neue Haas Grotesk Display    | UI 요소 · 영문 제목          | Adobe Fonts (`packages/styles/src/fonts.ts`) |

클래스를 지정하지 않으면 Pretendard가 적용됩니다. `font-neuehaas` 안의 한글은 Pretendard로 대체됩니다.

`font-neuehaas` 의 굵기 클래스는 **폰트 이름 그대로** 나오도록 맞춰 뒀습니다. (`packages/styles/src/global.css` 의 `.font-neuehaas`) 이 네 가지만 씁니다.

| 클래스               | Neue Haas |
| -------------------- | --------- |
| `font-light`         | 45 Light  |
| `font-normal` (기본) | 55 Roman  |
| `font-medium`        | 65 Medium |
| `font-bold`          | 75 Bold   |

Adobe Fonts 웹 프로젝트의 허용 도메인에 배포 도메인과 `localhost`가 등록되어 있어야 합니다.

### 색 체계

색은 `packages/styles/src/global.css`의 `@theme`에서 정하고, 두 앱이 같이 씁니다. 전체 견본은 admin의 **Design System** 페이지(`/design-system`)에서 볼 수 있습니다.

| 묶음     | 색                                                | 쓰는 예                                   |
| -------- | ------------------------------------------------- | ----------------------------------------- |
| Theme    | `indigo` `purple` `pink` `gold` `skyblue`         | `bg-indigo`                               |
| Semantic | `primary`(=indigo), `theme-01`–`theme-04`(분야별) | `text-primary`, `bg-theme-02`             |
| Surface  | `background` `sheet` `field` `white` `black`      | 페이지 `bg-background`, 입력칸 `bg-field` |
| Text     | `main` `sub` `mute` (글자 전용, `--text-color-*`) | `text-main`, `text-sub`                   |
| Gray     | `gray-50` – `gray-950`                            | 테두리 기본값 `border-gray-200`           |

- 색을 바꾸거나 추가하면 Design System 페이지의 목록(`apps/admin/src/app/design-system/page.tsx`)에도 넣어 주세요.
- TS에서 값이 필요한 색(`themeColor`, `mask-icon`)은 `packages/styles/src/colors.ts`에 따로 적혀 있으니 함께 고칩니다. `manifest.json`의 `theme_color`, `background_color`도 맞춰 주세요.

### 공통 컴포넌트 (`@repo/common`)

| 컴포넌트            | 쓰는 법                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `Button`            | `<Button variant="solid \| outline \| ghost" size="sm \| md \| lg" loading block>`                                 |
| `buttonClassName()` | 링크 등에 버튼 모양 입히기 `<Link className={buttonClassName({ variant: "outline" })}>`                            |
| `IMAGE_RATIOS`      | 이미지 비율 `thumbnail`(4:3) · `banner`(16:9) · `profile`(3:4). 클래스는 `aspect-thumbnail` 처럼 바로 써도 됩니다  |
| `Spinner`           | `<Spinner size="lg" />` — 글자색을 따라감. `className="text-primary"` 로 색 변경                                   |
| `LoadingOverlay`    | `<LoadingOverlay open message detail />` — 끝날 때까지 화면을 막는 로딩 팝업                                       |
| `Container`         | 가운데 정렬 · 최대 폭                                                                                              |
| `RulerSlider`       | 눈금자 모양 슬라이더 (`size="sm \| md"`). 조절 페이지(`/agent-tune`)에서 사용                                      |
| `ThemeDot`          | `<ThemeDot number={theme.number} />` — 리서치 분야 컬러칩. 01 purple · 02 pink · 03 gold · 04 skyblue (`theme-0N`) |

- 모서리: 담는 면일수록 둥글게, 안에 놓이는 것일수록 덜 둥글게. 패널 · 카드 · 모달 `rounded-3xl` → 안의 상자 · 이미지 · 알림 `rounded-2xl` → 버튼 · 입력칸 `rounded-lg`(작은 버튼 `rounded-md`)
- client 는 선(border) 없이 면으로 구분합니다. 카드 `bg-sheet/60`, 카드 안의 알약 `bg-white`. 구역 사이도 구분선 대신 넉넉한 여백으로 나눕니다.

### 모션 · 인터랙션 (client)

라이브러리: `motion`(motion/react) · `swiper` · `react-type-animation` · `leva`(조절 페이지 전용). 아래 부품은 `apps/client/src/components/` 에 있습니다.

| 부품            | 하는 일                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| `InView`        | `content/InView.tsx` — 화면에 들어오면 아래에서 떠오르며 나타남. `as` · `delay` · `y`                        |
| `RevealItem`    | `content/RevealItem.tsx` — 목록 항목이 무작위 같은 순서로 천천히 나타남 (People)                             |
| `Reveal`        | `content/Reveal.tsx` — CSS 로 만든 등장 상자 (예전 부품, 일부 화면에서 사용)                                 |
| `TypedText`     | `content/TypedText.tsx` — 타이핑 효과. 홈의 랩 이름에만 씁니다                                               |
| `ImageCarousel` | `content/ImageCarousel.tsx` — Swiper 가로 캐러셀. 화면 끝까지 넓고, 좌우 영역에서 커서가 prev / next 로 바뀜 |
| `CustomCursor`  | `CustomCursor.tsx` — 사이트 커서. 요소에 `cursor-label="설명"` 을 달면 커서 아래에 설명이 뜹니다             |
| `PageVeil`      | `PageVeil.tsx` — 페이지 이동 때 유리 베일. `app/[lang]/loading.tsx` 의 `data-page-loading` 이 사라지면 걷힘  |

### 배경 그래픽과 조절 페이지

홈 히어로 · 푸터 배경 · 에이전트 구는 WebGPU/WebGL 셰이더입니다. 값은 JSON 파일에 있고, 조절 페이지에서 바꿉니다. 패널(Leva)에서 조절한 뒤 **JSON 복사**로 값 파일에 통째로 붙여 넣으세요.

| 조절 페이지      | 값 파일                                                                               |
| ---------------- | ------------------------------------------------------------------------------------- |
| `/hero-tune`     | `apps/client/src/components/home/hero-background.json`                                |
| `/footer-tune`   | `apps/client/src/components/footer-background/footer-background.json`                 |
| `/projects-tune` | `apps/client/src/components/home/projects-background.json`                            |
| `/agent-tune`    | 에이전트 구 — [agent-blob/README.md](apps/client/src/components/agent-blob/README.md) |

조절 페이지는 검색엔진에 노출되지 않습니다(`noindex`).

### 사이트 위 피드백 코멘트 (client, 개발 서버 전용)

`yarn dev` 로 띄운 client 화면 가운데 아래에 **코멘트 남기기 · 목록** 버튼이 생깁니다. 배포 사이트에는 나오지 않습니다.

1. **코멘트 남기기**를 켜고 고칠 요소를 누른 뒤 내용을 적고 저장합니다. (⌘↵ 저장 · Esc 취소/끝내기) 켜져 있는 동안에는 링크 · 버튼이 동작하지 않습니다.
2. 코멘트는 루트 `.feedback/comments.json` 에 쌓입니다. 페이지 주소 · 요소 선택자 · 요소의 글자 · React 컴포넌트 이름이 함께 저장됩니다. 레포가 public 이라 `.gitignore` 에 넣어 두었습니다.
3. Claude Code 에 **"피드백 반영해줘"** 라고 하면 남은(`open`) 코멘트를 읽고 고친 뒤, 코멘트를 `done` 으로 바꾸고 무엇을 바꿨는지 한 줄 메모(`note`)를 남깁니다.
4. 화면으로 돌아오면 파일을 다시 읽어서, 반영된 코멘트는 ✓ 핀과 메모로 보입니다. 마음에 안 들면 핀에서 **다시 열기**, 필요 없으면 **삭제**합니다.

코드는 `apps/client/src/components/feedback/` (화면) 과 `apps/client/src/app/api/feedback/route.ts` (파일 저장, 배포 빌드에서는 404) 에 있습니다.

### admin 전용 UI

| 이름                           | 쓰는 법                                                                                                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `toast()` · `toast.error()`    | `@/libs/toast` — 오른쪽 위 알림. 서버 액션 결과는 `notify(result)`                                                                                                                                |
| `openModal()` · `closeModal()` | `@/libs/modal` — 전역 모달. 768px 보다 좁으면 바텀시트(`react-modal-sheet`)로 뜹니다                                                                                                              |
| `EditorForm`                   | `@/components/editor` — 편집 화면 틀(위 도구 막대 · 왼쪽 내용 · 오른쪽 속성). ⌘S 저장, 저장 안 한 변경 표시                                                                                       |
| `Switch`                       | `@/components/forms` — 켜고 끄는 값 (공개 · NDA)                                                                                                                                                  |
| 사이트 미리보기                | 편집 화면 도구 막대의 **미리보기** — 저장 전 내용을 사이트와 같은 공용 컴포넌트(`@repo/blocks` 의 `ProjectCard` · `ProjectDetail` · `ResearchCard` · `PersonCard`)로 바로 보여 줍니다. 한/영 전환 |

- 새 프로젝트 · 새 분야 · 새 구성원 · 내 프로필은 모달에서 최소 정보만 받아 비공개로 만들고, 편집 화면으로 이동합니다.
- **Recruit**(`/recruit`, 메인테이너): 사이트 Join 구역 관리. 모집 중이면 버튼이 지원 링크로, 아니면 "모집 기간이 아닙니다" 안내 모달로 연결됩니다. Join 문구 · 모달 문구(한/영)도 여기서 고칩니다. (`recruit` 표)
- **Notices**(`/notices`): 공지사항. 누구나 쓰고, 고정은 메인테이너. 본인 글만 고치고 지우며 메인테이너는 모든 글을 지울 수 있습니다. 글마다 댓글 · 반응(👍 ❤️ 🎉 👀 🙏)을 달 수 있고, 보기 화면 오른쪽에 다른 공지 목록이 있습니다.
- **System Check**(`/system`, 메인테이너): 연결 상태 · DB 구조(마이그레이션) · 환경 변수 · 무료 플랜 사용량. 한도는 `SUPABASE_FREE_LIMITS`.
- **일반 멤버로 보기**: 메인테이너가 사이드바에서 켜면 일반 멤버 화면(메뉴 · 대시보드)으로 봅니다. 화면만 바뀌고 권한은 그대로입니다.
- **이미지 편집**: 올릴 때와 "편집"을 누를 때 크롭 도구가 뜹니다. 원본은 그대로 두고 보일 영역을 키 끝에 `#crop=x,y,w,h`(%)로 적고, 사이트 · admin 은 `CroppedImage` 로 그 영역만 보여 줍니다.
- **끌어서 순서 바꾸기**(`@dnd-kit`): 분야 이미지, People 그룹 안 순서(손잡이 ⠿, 놓으면 바로 저장).
- 사이트 고정 문구(About 등)는 `apps/client/src/i18n/dictionaries`, 협력 기관은 `apps/client/src/constants` 의 `PARTNERS` 에서 고칩니다.

## admin 계정과 권한

admin은 Supabase 로그인(이메일 + 비밀번호)으로 들어갑니다. 이메일 인증은 쓰지 않습니다.

1. `/signup`에서 가입하면 **승인 대기** 상태가 됩니다. 로그인해도 대기 화면만 보입니다.
2. **메인테이너**가 **Lab Members**(`/members`)에서 승인합니다. 승인할 때 함께 고릅니다.
   - **People 연결**: 이미 있는 구성원(People)이면 이어 줍니다. 이름이 같은 구성원을 먼저 제안합니다.
   - **본인 프로필 권한**: 주면 본인이 **Profile**(`/profile`)에서 프로필을 만들고 고칩니다. (연결된 구성원이 없으면 새로 만듦)
3. Lab Members에서 거절 · 정지 · 정지 해제 · 삭제, 메인테이너/일반 변경, **비밀번호 재설정 링크** 만들기도 합니다.

|                     | 메인테이너                                                                 | 일반 멤버                                                                            |
| ------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Research · Projects | 모두 읽고 쓰기                                                             | 모두 읽고 쓰기                                                                       |
| People              | **People** — 맨 위에 내 프로필, 아래에 전체 구성원 관리 · 계정 연결 · 공개 | **Profile** — 본인 프로필만 (권한이 있을 때). 그룹 · 공개 · 순서는 메인테이너가 정함 |
| 계정                | **Lab Members** — 모든 계정 관리                                           | —                                                                                    |
| **Settings**        | 계정 정보 (메인테이너는 탈퇴 불가)                                         | 계정 정보 · **탈퇴** (People 프로필 함께 삭제 선택)                                  |

- 화면에는 **메인테이너(Maintainer)**로 보이고, DB · 코드의 역할 값은 `master`입니다. (`is_master()`, `requireMaster()`)
- **처음 가입한 계정**은 자동으로 승인된 메인테이너가 됩니다. 배포 직후 담당자가 먼저 가입하세요.
- People은 계정 없이도 있을 수 있습니다. 한 계정은 한 구성원에만 연결되고, 계정을 지우면 프로필은 남고 연결만 풀립니다.
- 권한은 DB(RLS · 트리거)가 직접 확인하므로 화면을 우회해도 막힙니다. 자기 계정의 상태 · 권한은 바꿀 수 없어서 메인테이너가 0명이 되지 않습니다.
- **비밀번호 재설정 링크**: 이메일을 보내지 않고 링크만 만듭니다. 메인테이너가 본인에게 전달하면, 링크를 연 사람이 새 비밀번호를 정합니다. (1시간 · 한 번만, `/auth/confirm` → `/reset-password`)
- 계정 삭제 · 탈퇴 · 재설정 링크는 `SUPABASE_SECRET_KEY`가 필요합니다. (서버에서만)
- 원격 Supabase 대시보드에서 **Authentication → Sign In / Providers → Email의 "Confirm email"을 끄고**, 비밀번호 최소 길이를 8로 맞춥니다. (로컬은 `supabase/config.toml`에 설정됨)

## 다국어 (client)

client는 한국어·영어 두 언어를 주소로 나눕니다. admin은 한국어만 씁니다.

- **주소:** 한국어(기본)는 언어 없이 `/`, `/people`, 영어는 `/en`, `/en/people`입니다. 처음 방문하면 브라우저 언어와 상관없이 한국어입니다.
- **페이지 파일:** 모두 `src/app/[lang]/` 아래에 둡니다. 한국어 주소는 `src/proxy.ts`가 안에서만 `/ko/...`로 바꿔 보여주고(주소창은 그대로), `/ko/...`로 직접 들어오면 언어 없는 주소로 이동시킵니다.
- **화면 고정 문구:** `src/i18n/dictionaries/ko.ts`, `en.ts`. 키를 추가하면 두 파일 모두에 넣어야 타입 검사를 통과합니다.
- **DB 콘텐츠:** 칸을 `title_ko` / `title_en`처럼 나누고 `localized(row, "title", locale)`로 고릅니다. 영문이 비어 있으면 한글을 보여줍니다.

```tsx
// 서버 컴포넌트 어디서든 (props 없이)
import { getDictionary, getLocale } from "@/i18n/server";
const locale = await getLocale(); // "ko" | "en"
const dict = await getDictionary();

// 링크에는 언어를 붙입니다
import { localePath } from "@/i18n";
<Link href={localePath(locale, ROUTES.people)}>{dict.nav.people}</Link>;

// 페이지 metadata: canonical + 언어별 주소(hreflang)
alternates: localeAlternates(lang, "/people"),
```

클라이언트 컴포넌트에서는 `@/i18n/server`를 쓸 수 없으니, 필요한 언어·문구를 서버 컴포넌트에서 props로 넘깁니다. (`LanguageSwitch` 참고)

## SEO

- `layout.tsx` 메타데이터: `metadataBase`, title 템플릿, Open Graph, Twitter, robots, 검색엔진 소유 확인
- 모든 페이지: canonical, 언어별 주소(`hreflang`), JSON-LD(`WebSite`, `components/Layout.tsx`)
- `robots.ts`, `sitemap.ts`(언어별 주소 포함), `manifest.json`
- 기본 OG 이미지 `public/icons/op-image.png`
- GA/GTM: `@next/third-parties`, 환경변수가 있을 때만 로드
- admin은 `noindex` + `robots.txt` 전체 차단, 다른 사이트의 iframe 삽입 차단

사이트 이름·작성자는 `apps/<app>/src/config/index.ts`의 `APP_INFO`에서, client의 사이트 설명은 `src/i18n/dictionaries`에서 바꿉니다.

`public/icons/`의 이미지는 모두 플레이스홀더이니 실제 이미지로 교체하세요. `share.png`는 아직 어디에도 연결되지 않았습니다(카카오톡 공유 썸네일 등 용도에 맞게 연결).

### 동적 페이지와 404 상태 코드

client 는 `app/[lang]/loading.tsx`(admin 은 `app/loading.tsx`)가 있어 페이지가 스트리밍됩니다. 이때 상세 페이지에서 `notFound()`를 호출하면 화면은 404지만 HTTP 상태는 **200**으로 나갑니다. 대신 `noindex`가 붙어 검색엔진에는 노출되지 않습니다.

정확한 404 상태 코드가 필요하면 `loading.tsx`를 필요한 경로에만 두세요. client 의 `loading.tsx` 는 페이지 전환(`PageVeil`)이 로딩이 끝났는지 알아보는 데에도 쓰입니다(`data-page-loading`). 옮기면 함께 확인하세요.

## 주요 명령어

```bash
yarn dev            # 전체 앱 개발 서버 (client 3000, admin 3001)
yarn build          # 전체 프로덕션 빌드
yarn check-types    # 전체 TypeScript 검사
yarn lint           # 전체 ESLint 검사
yarn format         # Prettier

yarn db:start       # 로컬 Supabase 실행
yarn db:reset       # 로컬 DB 초기화 + 마이그레이션/시드 적용
yarn db:migration <name>  # 새 마이그레이션 파일
yarn db:push        # 원격 DB에 마이그레이션 반영
yarn db:types       # DB 타입 재생성 → apps/*/src/types/database.ts
```

## 아직 포함하지 않은 것

- admin 저장 즉시 client 반영: 지금은 client 페이지가 최대 60초 뒤 갱신됩니다(`revalidate = 60`).
