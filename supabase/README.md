# supabase

admin(관리자)과 client(홈페이지)가 함께 쓰는 Supabase 데이터베이스 스키마를 모아두는 곳입니다.
모든 스키마 변경은 `migrations/`에 **시간순으로 누적**되고, 한 번 적용된 파일은 수정하지 않고 그대로 보관(아카이브)합니다.

```
supabase/
├── config.toml        # 로컬 Supabase 스택 설정 (supabase init 으로 생성)
├── migrations/        # 스키마 변경 이력 — append-only 아카이브
├── seed.sql           # 초기 데이터: 기존 사이트 내용 (db reset 시 실행)
└── README.md          # 이 문서 + 마이그레이션 기록
```

## 규칙

1. **새 변경 = 새 파일.** 테이블/컬럼/정책을 바꿀 때는 기존 파일을 고치지 말고 새 마이그레이션을 만듭니다.
   ```bash
   supabase migration new create_posts
   # → supabase/migrations/<YYYYMMDDHHMMSS>_create_posts.sql
   ```
2. **적용된 파일은 불변.** 원격 DB에 반영된 마이그레이션을 수정·삭제하면 이력이 어긋납니다. 잘못된 부분은 되돌리는 마이그레이션을 새로 추가합니다.
3. **파일 하나 = 의도 하나.** 파일 첫 줄 주석에 무엇을 왜 바꾸는지 적습니다.
4. **RLS는 같은 파일에서.** 새 테이블을 만들면 같은 마이그레이션에서 `enable row level security`와 정책까지 정의합니다.
5. **타입 재생성.** 스키마를 바꾼 뒤 `yarn db:types`로 `apps/client/src/types/database.ts`, `apps/admin/src/types/database.ts`를 갱신하고 함께 커밋합니다.
6. **기록 남기기.** 아래 마이그레이션 기록 표에 한 줄 추가합니다.

## 자주 쓰는 명령

루트에서 실행합니다. (Docker 필요)

| 명령                                | 설명                                                    |
| ----------------------------------- | ------------------------------------------------------- |
| `supabase start`                    | 로컬 Supabase 스택 실행 (API :54321, Studio :54323)     |
| `supabase db reset`                 | 로컬 DB를 지우고 `migrations/` 전체 + `seed.sql` 재적용 |
| `supabase migration new <name>`     | 새 마이그레이션 파일 생성                               |
| `supabase db diff -f <name>`        | Studio에서 바꾼 내용을 마이그레이션 파일로 추출         |
| `supabase link --project-ref <ref>` | 원격 프로젝트 연결                                      |
| `supabase db push`                  | 아직 적용되지 않은 마이그레이션을 원격 DB에 반영        |
| `yarn db:types`                     | 로컬 DB 기준 TypeScript 타입 생성                       |

## 키 사용 구분

| 앱     | 키                                              | 권한                                                                      |
| ------ | ----------------------------------------------- | ------------------------------------------------------------------------- |
| client | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`          | `anon`: 공개(`is_published`)된 콘텐츠 읽기                                |
| admin  | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` + 로그인 | `authenticated`: 승인된 계정은 콘텐츠 읽기 · 쓰기, 메인테이너는 계정 관리 |
| admin  | `SUPABASE_SECRET_KEY` (서버 전용)               | RLS 우회. 메인테이너의 비밀번호 재설정에만 사용                           |

## 원격 프로젝트 설정 (대시보드)

- Authentication → Sign In / Providers → Email: **Confirm email 끄기** (이메일 인증을 쓰지 않음)
- 비밀번호 최소 길이 8 (`config.toml`의 `minimum_password_length`와 같게)

## 마이그레이션 기록

| 파일                                     | 날짜       | 내용                                                                                                                                                                        |
| ---------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `20261115144731_init.sql`                | 2026-11-15 | 초기 스키마: 리서치 분야 · 프로젝트 · 연결 · 구성원(한/영 칸, 공개 읽기 RLS), admin 계정(가입 → 승인, master / member, 콘텐츠 쓰기 RLS)                                     |
| `20261115164458_create_media_bucket.sql` | 2026-11-15 | 이미지 저장소: Storage 공개 버킷 `media`, 승인된 admin 계정만 올리기 · 바꾸기 · 지우기                                                                                      |
| `20261115215000_people_accounts.sql`     | 2026-11-15 | People ↔ 계정 연결(`people.admin_user_id`), 본인 프로필 권한(`admin_users.can_edit_profile`), 계정 정지(`suspended`). People 쓰기는 메인테이너 전체 + 권한 있는 본인 프로필 |
| `20261116120000_project_slug.sql`        | 2026-11-16 | 프로젝트 주소 `projects.slug` (사이트 공유 링크 `/projects#<slug>`). 비우면 영문 제목으로 자동 생성, 기존 행도 채움                                                         |
| `20261116150000_site_settings.sql`       | 2026-11-16 | 사이트 설정 `site_settings`(키-값). `join_url` = Join 버튼 링크. 누구나 읽고 메인테이너만 수정 (admin → Site)                                                               |
| `20261116180000_notices_system.sql`      | 2026-11-16 | 공지사항 `notices` (누구나 쓰기 · 고정은 메인테이너 · 본인 글만 수정/삭제, 메인테이너는 전부) · System Check 사용량 함수 `system_usage()` (메인테이너)                      |
| `20261116200000_recruit.sql`             | 2026-11-16 | 모집 설정 `recruit`(한 줄): 모집 중 여부 · 지원 링크 · Join 문구 · 닫혔을 때 모달 문구(한/영). 이전 `site_settings`의 링크를 옮기고 그 표는 지움                            |
| `20261116210000_notice_comments.sql`     | 2026-11-16 | 공지 댓글 `notice_comments`(누구나 쓰기 · 본인/메인테이너 삭제) · 반응 `notice_reactions`(👍 ❤️ 🎉 👀 🙏, 한 사람이 종류별 한 번) · 이름 맞추기 확장                        |
