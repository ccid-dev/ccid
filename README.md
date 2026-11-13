# CMS Boilerplate

Next.js · Supabase · Cloudflare R2 기반 CMS 보일러플레이트입니다.
공개 사이트(`client`)와 관리자(`admin`)가 블록·스타일·공용 컴포넌트를 공유하는 Turborepo 모노레포입니다.
DB 스키마는 아직 정하지 않은 상태이며, Supabase·R2 연결, SEO, 프로젝트 구조만 잡혀 있습니다.

- **Supabase**: 데이터 저장 (Postgres + RLS). 스키마는 `supabase/migrations`에 추가합니다.
- **Cloudflare R2**: 이미지 등 미디어 저장 (S3 호환)

## 시작하기

요구 사항: Node.js 24 이상, Yarn 1.22.22, Supabase CLI (로컬 DB를 쓸 경우 Docker)

```bash
yarn install
cp .env.example .env.local   # 필요한 키 채우기
yarn dev
```

- Client: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3001](http://localhost:3001)

### Supabase 연결

```bash
yarn db:start     # 로컬 Supabase 실행 → 출력된 URL / Publishable key / Secret key 를 .env.local 에
yarn db:reset     # supabase/migrations 전체 + seed.sql 적용
```

원격 프로젝트는 `supabase link --project-ref <ref>` 후 `yarn db:push`로 마이그레이션을 반영합니다.
스키마 관리 규칙은 [supabase/README.md](supabase/README.md)를 참고하세요.

### Cloudflare R2 연결

1. R2 버킷을 만들고 공개 접근(r2.dev 또는 커스텀 도메인)을 켭니다.
2. **Manage API tokens**에서 Object Read & Write 토큰을 발급해 `R2_*` 값을 채웁니다.
3. 버킷 CORS에 admin 도메인의 `PUT`을 허용합니다.
   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3001"],
       "AllowedMethods": ["PUT"],
       "AllowedHeaders": ["content-type"]
     }
   ]
   ```

브라우저 업로드는 `hooks/useMediaUpload`를 씁니다. 블록 편집기의 이미지 블록에 연결되어 있습니다.

```ts
const { upload, isUploading, error } = useMediaUpload();
const url = await upload(file); // 공개 URL (실패하면 null)
```

내부적으로 `POST /api/upload`로 presigned URL을 받은 뒤 파일을 R2에 직접 `PUT`합니다.

- 형식·용량 제한은 `constants`의 `MEDIA_UPLOAD`에 있습니다. 기본값은 jpg/png/webp/avif/gif, 최대 10MB입니다. SVG는 스크립트를 담을 수 있어 막아 두었습니다.
- presigned URL에는 Content-Type과 Content-Length가 서명에 포함되어, 요청할 때 말한 것과 다른 파일은 R2가 거부합니다.
- 서버 코드에서는 `libs/r2.ts`의 `putR2Object()`, `deleteR2Object()`를 씁니다.

## 환경변수

모든 env는 **루트 `.env.local` 하나**로 관리합니다. 루트 `next.config.base.mjs`가 루트 env 파일을 읽습니다. 항목 설명은 [.env.example](.env.example)에 있습니다.

| 변수                                                                     | 사용처     | 비고                                                               |
| ------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`                                                   | client     | canonical, sitemap, OG 기준 도메인. 배포 빌드에서 비어 있으면 경고 |
| `GOOGLE_SITE_VERIFICATION`, `NAVER_SITE_VERIFICATION`                    | client     | 검색엔진 소유 확인 (선택)                                          |
| `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GA_ID`                                | client     | Google Tag Manager / Analytics (선택)                              |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`       | 공통       | 공개 키 (RLS 적용)                                                 |
| `SUPABASE_SECRET_KEY`                                                    | admin 서버 | service_role, RLS 우회                                             |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | admin 서버 | 업로드/삭제                                                        |
| `NEXT_PUBLIC_R2_PUBLIC_URL`                                              | 공통       | 미디어 공개 URL, `next/image` 허용 도메인                          |

`NEXT_PUBLIC_*`는 빌드할 때 코드에 박히므로, 값을 바꾸면 다시 빌드해야 합니다. 개발 중에는 dev 서버를 다시 시작하세요.

## 프로젝트 구조

```text
apps/
├─ client/                  # 공개 사이트 (SEO 포함)
└─ admin/                   # 에디터 / 관리자
packages/
├─ blocks/                  # 포스트 블록: 블록 타입 + BlockRenderer
├─ styles/                  # 색상 토큰(colors.ts) · Tailwind 테마(global.css)
└─ common/                  # 공용 Header · Footer · Container
supabase/
├─ config.toml
├─ migrations/              # 스키마 변경 이력 (append-only)
└─ seed.sql
next.config.base.mjs        # 두 앱 공통 Next 설정 (env 로드, svgr, R2 이미지, 보안 헤더)
tsconfig.base.json          # 공통 TypeScript 설정
eslint.config.mjs           # 공통 ESLint 설정
```

두 앱은 같은 폴더 구조를 따릅니다.

```text
apps/<app>/
├─ public/
│  ├─ fonts/                # next/font/local 로 읽는 폰트
│  ├─ icons/                # 파비콘 · 앱 아이콘 · OG 이미지
│  └─ img/
└─ src/
   ├─ app/                  # layout · loading · not-found · page · manifest.json
   │  └─ api/               # 서버 기능 (Route Handlers). admin: upload
   ├─ components/           # Layout.tsx(공통 레이아웃), index.ts (admin: BlockEditor)
   ├─ config/               # env → 설정 (admin은 서버 전용 config/server.ts 포함)
   ├─ constants/            # 경로, 업로드 제한 등
   ├─ libs/                 # supabase · r2 클라이언트, seo(client)
   ├─ styles/global.css
   ├─ theme/                # 폰트, 색상 (색상 원본은 packages/styles)
   ├─ types/                # database.ts(Supabase 생성 타입), api.ts(admin), svg.d.ts
   ├─ hooks/                # admin: useMediaUpload
   └─ utils/
```

### import 경로

```ts
import { Layout } from "@/components"; // src/*
import Logo from "@/public/img/logo.svg"; // public/*
import { Header } from "@repo/common"; // packages
import { colors } from "@repo/styles";
```

SVG는 `@svgr/webpack`(Turbopack 로더)으로 React 컴포넌트가 됩니다.

```tsx
<Logo className="h-6 w-auto" />
```

### 색상 바꾸기

`packages/styles/src/colors.ts`(TS에서 쓰는 값)와 `packages/styles/src/global.css`의 `@theme`(Tailwind 클래스)을 함께 고칩니다. `manifest.json`의 `theme_color`, `background_color`도 맞춰 주세요.

## SEO (client)

- `layout.tsx` 메타데이터: `metadataBase`, title 템플릿, Open Graph, Twitter, robots, 검색엔진 소유 확인
- 홈: canonical, JSON-LD(`WebSite`)
- `robots.ts`, `sitemap.ts`, `manifest.json`
- 기본 OG 이미지 `public/icons/op-image.png`
- GA/GTM: `@next/third-parties`, 환경변수가 있을 때만 로드
- admin은 `noindex` + `robots.txt` 전체 차단

사이트 이름·설명·작성자는 `apps/<app>/src/config/index.ts`의 `APP_INFO`에서 바꿉니다.

`public/icons/`의 이미지는 모두 플레이스홀더이니 실제 이미지로 교체하세요. `share.png`는 아직 어디에도 연결되지 않았습니다(카카오톡 공유 썸네일 등 용도에 맞게 연결).

### 동적 페이지와 404 상태 코드

루트에 `app/loading.tsx`가 있으면 페이지가 스트리밍됩니다. 이때 상세 페이지에서 `notFound()`를 호출하면 화면은 404지만 HTTP 상태는 **200**으로 나갑니다. 대신 `noindex`가 붙어 검색엔진에는 노출되지 않습니다.

정확한 404 상태 코드가 필요하면 `loading.tsx`를 루트 대신 필요한 경로에만 두세요.

## 주요 명령어

```bash
yarn dev            # 전체 앱 개발 서버
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

각 앱의 `yarn start`는 dev와 같은 포트(client 3000, admin 3001)로 뜹니다.

## 아직 포함하지 않은 것

- DB 스키마: `supabase/migrations`에 추가한 뒤 `yarn db:types` 실행
- 인증: admin과 `/api/upload`는 누구나 접근할 수 있습니다. 공개 배포 전에는 인증을 붙이거나 접근을 막으세요(예: 사내망·Vercel 비밀번호 보호·Cloudflare Access).
- 저장 기능: admin 홈의 블록 편집기는 체험용입니다. 스키마를 정한 뒤 `BlockEditor`의 `onSave`에 저장 로직을 연결하세요.
