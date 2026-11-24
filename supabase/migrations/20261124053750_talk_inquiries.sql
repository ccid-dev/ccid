-- ══════════════════════════════════════════════
-- 보이스 에이전트: 문의 보관(inquiries) · 하루 사용량(talk_usage)
--
-- 문의: 사이트 에이전트가 대화로 받은 문의를 쌓아 두고(아카이브), admin(Inquiries)에서 메인테이너가 봅니다.
-- - 저장은 사이트 서버(client 의 /api/talk/chat)가 secret key 로만 합니다. anon 에는 아무 권한이 없습니다.
--   공개 키로 직접 넣지 못하게 해서, 사람 확인 · 횟수 한도를 거친 요청만 저장되게 합니다.
-- - 방문자가 "네" 버튼과 말로 동시에 보내도 한 번만 저장되도록 key(서버가 만든 해시)에 unique.
-- - 메인테이너는 읽기 · 처리 상태 바꾸기 · 지우기만 합니다. 문의 내용은 고치지 않습니다.
--
-- 하루 사용량: 사이트 전체 하루 한도를 서버 여러 대에서도 정확히 세려고 날짜(한국 시간)별로 한 줄.
-- 서버만 talk_usage_bump 로 올리고, 메인테이너는 읽기만 합니다.
-- ══════════════════════════════════════════════

-- ──────────────────────────────────────────────
-- 문의
-- ──────────────────────────────────────────────
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,                                        -- 같은 미리보기 중복 저장 방지
  topic text not null default 'other'
    check (topic in ('collaboration', 'advisory', 'careers', 'other')),
  message text not null check (char_length(message) between 1 and 1200),
  name text not null check (char_length(name) between 1 and 80),
  email text not null check (char_length(email) between 3 and 120),
  organization text not null default '' check (char_length(organization) <= 120),
  lang text not null default 'ko' check (lang in ('ko', 'en')),     -- 사이트 언어
  status text not null default 'new' check (status in ('new', 'read', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inquiries_list_idx on public.inquiries (created_at desc);

create trigger inquiries_updated_at before update on public.inquiries
  for each row execute function public.set_updated_at();

alter table public.inquiries enable row level security;

grant select, delete on public.inquiries to authenticated;
grant update (status) on public.inquiries to authenticated;        -- 처리 상태만

create policy "메인테이너 읽기" on public.inquiries
  for select to authenticated using ((select public.is_master()));
create policy "메인테이너 상태 바꾸기" on public.inquiries
  for update to authenticated
  using ((select public.is_master()))
  with check ((select public.is_master()));
create policy "메인테이너 지우기" on public.inquiries
  for delete to authenticated using ((select public.is_master()));

-- ──────────────────────────────────────────────
-- 하루 사용량
-- ──────────────────────────────────────────────
create table public.talk_usage (
  day date primary key,                                            -- 한국 시간 날짜
  chats integer not null default 0,                                -- 대답 요청
  listens integer not null default 0,                              -- 받아 적기 요청
  speaks integer not null default 0,                               -- 목소리 요청
  speak_chars integer not null default 0,                          -- 목소리로 읽은 글자 수 (ElevenLabs 과금 기준)
  inquiries integer not null default 0                             -- 저장한 문의
);

alter table public.talk_usage enable row level security;

grant select on public.talk_usage to authenticated;

create policy "메인테이너 읽기" on public.talk_usage
  for select to authenticated using ((select public.is_master()));

-- 오늘 한 항목을 amount 만큼 올리고 새 값을 돌려줍니다. (사이트 서버 · secret key 전용)
create function public.talk_usage_bump(kind text, amount integer default 1)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  today date := (now() at time zone 'Asia/Seoul')::date;
  result integer;
begin
  if kind not in ('chats', 'listens', 'speaks', 'speak_chars', 'inquiries') then
    raise exception '알 수 없는 항목: %', kind using errcode = '22023';
  end if;
  insert into public.talk_usage (day) values (today) on conflict (day) do nothing;
  execute format(
    'update public.talk_usage set %1$I = %1$I + $1 where day = $2 returning %1$I',
    kind
  ) into result using amount, today;
  return result;
end;
$$;

revoke execute on function public.talk_usage_bump(text, integer) from public, anon, authenticated;
grant execute on function public.talk_usage_bump(text, integer) to service_role;
