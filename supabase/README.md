# supabase

admin(에디터)과 client(홈페이지)가 함께 쓰는 Supabase 데이터베이스 스키마를 모아두는 곳입니다.
모든 스키마 변경은 `migrations/`에 **시간순으로 누적**되고, 한 번 적용된 파일은 수정하지 않고 그대로 보관(아카이브)합니다.

```
supabase/
├── config.toml        # 로컬 Supabase 스택 설정 (supabase init 으로 생성)
├── migrations/        # 스키마 변경 이력 — append-only 아카이브 (아직 비어 있음)
├── seed.sql           # 로컬 개발용 샘플 데이터 (db reset 시 실행)
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

| 앱                | 키                                     | 권한                                      |
| ----------------- | -------------------------------------- | ----------------------------------------- |
| client            | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `anon`: RLS 정책이 허용한 데이터만 접근   |
| admin (서버 전용) | `SUPABASE_SECRET_KEY`                  | `service_role`: RLS 우회, 서버에서만 사용 |

## 마이그레이션 기록

| 파일          | 날짜 | 내용 |
| ------------- | ---- | ---- |
| _(아직 없음)_ |      |      |
