-- 초기 스키마: 콘텐츠(리서치 분야 · 프로젝트 · 연결 · 구성원) + admin 계정과 권한
--
-- 콘텐츠
-- - 텍스트 칸은 client 한/영 전환을 위해 <칸>_ko / <칸>_en 쌍으로 둡니다. 비어 있으면 다른 언어로 대신 보여줍니다.
-- - 이미지는 Cloudflare R2 키(예: "research/interfaces/cover.webp")를 저장합니다.
-- - 누구나(anon) is_published = true 인 행만 읽을 수 있습니다.
--
-- admin 계정
-- - 가입 → 승인 대기 → 마스터가 승인. 권한은 master(계정 관리) / member(콘텐츠 관리).
-- - 이메일 인증은 쓰지 않습니다. 대신 승인 전에는 아무것도 할 수 없습니다.
-- - 처음 가입한 계정은 자동으로 승인된 마스터가 됩니다.
-- - 승인된 계정(마스터 · 일반)은 콘텐츠를 모두 읽고 쓸 수 있습니다. (비공개 포함)
-- - 마스터만 다른 계정의 상태 · 권한을 바꿀 수 있고, 자기 자신의 상태 · 권한은 바꿀 수 없습니다.
--   (그래서 마지막 마스터가 스스로 사라지는 일이 없습니다)

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ──────────────────────────────────────────────
-- 리서치 분야
-- ──────────────────────────────────────────────
create table public.themes (
  id uuid primary key default gen_random_uuid(),
  number smallint not null unique check (number > 0),            -- 01, 02 … (표시 순서)
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), -- 주소: /research/<slug>
  title_ko text not null default '',
  title_en text not null default '',
  question_ko text not null default '',                           -- 분야가 던지는 질문
  question_en text not null default '',
  summary_ko text not null default '',                            -- 요약 설명 (카드·목록)
  summary_en text not null default '',
  catchphrase_ko text not null default '',                        -- 캐치프레이즈
  catchphrase_en text not null default '',
  description_ko text not null default '',                        -- 상세 설명 (분야 페이지)
  description_en text not null default '',
  keywords_ko text[] not null default '{}',                       -- 세부 분야
  keywords_en text[] not null default '{}',
  images text[] not null default '{}',                            -- R2 키, 첫 장이 대표 이미지
  image_alt_ko text not null default '',
  image_alt_en text not null default '',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (title_ko <> '' or title_en <> '')
);

-- ──────────────────────────────────────────────
-- 프로젝트 (산학 협력 등)
-- ──────────────────────────────────────────────
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title_ko text not null default '',
  title_en text not null default '',
  client_ko text not null default '',                             -- 협력 기관
  client_en text not null default '',
  year_start smallint not null check (year_start between 2000 and 2100), -- 프로젝트 기간
  year_end smallint check (year_end is null or year_end >= year_start),  -- 한 해짜리면 비움
  tags_ko text[] not null default '{}',                           -- 프로젝트 분야 (해시태그)
  tags_en text[] not null default '{}',
  description_ko text not null default '',
  description_en text not null default '',
  is_nda boolean not null default false,                          -- NDA: 기본 정보만 공개
  sort_order integer not null default 0,                          -- 같은 해 안의 순서 (작을수록 앞)
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (title_ko <> '' or title_en <> '')
);

create index projects_year_idx on public.projects (year_start desc, sort_order);

-- ──────────────────────────────────────────────
-- 분야 ↔ 프로젝트 (N:N)
-- ──────────────────────────────────────────────
create table public.project_themes (
  project_id uuid not null references public.projects (id) on delete cascade,
  theme_id uuid not null references public.themes (id) on delete cascade,
  position smallint not null default 0,                           -- 0 이 주 분야
  primary key (project_id, theme_id)
);

create index project_themes_theme_idx on public.project_themes (theme_id);

-- ──────────────────────────────────────────────
-- 구성원
-- ──────────────────────────────────────────────
create table public.people (
  id uuid primary key default gen_random_uuid(),
  category text not null check (
    category in ('director', 'advisory_board', 'former_advisor', 'researcher', 'intern', 'alumni')
  ),
  name_ko text not null default '',
  name_en text not null default '',
  role_ko text not null default '',                               -- 직함 · 전문 분야
  role_en text not null default '',
  bio_ko text not null default '',                                -- 짧은 약력 (카드)
  bio_en text not null default '',
  profile_ko text not null default '',                            -- 긴 소개 (펼쳐 보기)
  profile_en text not null default '',
  image text not null default '',                                 -- R2 키
  sort_order integer not null default 0,                          -- 같은 그룹 안의 순서
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (name_ko <> '' or name_en <> '')
);

create index people_category_idx on public.people (category, sort_order);

-- updated_at
create trigger themes_updated_at before update on public.themes
  for each row execute function public.set_updated_at();
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger people_updated_at before update on public.people
  for each row execute function public.set_updated_at();

-- ──────────────────────────────────────────────
-- RLS: 공개된 행만 누구나 읽기
-- ──────────────────────────────────────────────
alter table public.themes enable row level security;
alter table public.projects enable row level security;
alter table public.project_themes enable row level security;
alter table public.people enable row level security;

grant select on public.themes, public.projects, public.project_themes, public.people
  to anon, authenticated;

create policy "공개된 분야 읽기" on public.themes
  for select to anon, authenticated using (is_published);

create policy "공개된 프로젝트 읽기" on public.projects
  for select to anon, authenticated using (is_published);

create policy "공개된 분야·프로젝트의 연결 읽기" on public.project_themes
  for select to anon, authenticated using (
    exists (select 1 from public.projects p where p.id = project_id and p.is_published)
    and exists (select 1 from public.themes t where t.id = theme_id and t.is_published)
  );

create policy "공개된 구성원 읽기" on public.people
  for select to anon, authenticated using (is_published);

-- ══════════════════════════════════════════════
-- admin 계정과 권한
-- ══════════════════════════════════════════════

create table public.admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null default '',
  role text not null default 'member' check (role in ('master', 'member')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_at timestamptz,
  approved_by uuid references public.admin_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger admin_users_updated_at before update on public.admin_users
  for each row execute function public.set_updated_at();

-- ──────────────────────────────────────────────
-- 권한 확인 함수 (RLS 정책에서 사용)
-- ──────────────────────────────────────────────
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where id = (select auth.uid()) and status = 'approved'
  );
$$;

create function public.is_master()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where id = (select auth.uid()) and status = 'approved' and role = 'master'
  );
$$;

revoke execute on function public.is_admin(), public.is_master() from public, anon;
grant execute on function public.is_admin(), public.is_master() to authenticated;

-- ──────────────────────────────────────────────
-- 가입하면 admin_users 에 한 줄 생성 (첫 계정은 승인된 마스터)
-- ──────────────────────────────────────────────
create function public.handle_new_admin_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  first_user boolean;
begin
  -- 동시에 두 명이 처음 가입해도 마스터가 하나만 생기도록 잠급니다.
  perform pg_advisory_xact_lock(hashtext('public.admin_users:first'));
  select not exists (select 1 from public.admin_users where role = 'master') into first_user;

  insert into public.admin_users (id, email, name, role, status, approved_at)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    case when first_user then 'master' else 'member' end,
    case when first_user then 'approved' else 'pending' end,
    case when first_user then now() end
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_admin_user();

-- ──────────────────────────────────────────────
-- 상태 · 권한 변경 규칙
-- ──────────────────────────────────────────────
create function public.guard_admin_user_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- 로그인 세션 밖(SQL 편집기, secret key)에서의 수정은 운영자 작업으로 보고 그대로 허용합니다.
  if (select auth.uid()) is null then
    return new;
  end if;

  if new.role is distinct from old.role or new.status is distinct from old.status then
    if not public.is_master() then
      raise exception '계정 상태와 권한은 마스터만 바꿀 수 있습니다.' using errcode = '42501';
    end if;
    if old.id = (select auth.uid()) then
      raise exception '자기 계정의 상태와 권한은 바꿀 수 없습니다.' using errcode = '42501';
    end if;
  end if;

  if new.status is distinct from old.status then
    if new.status = 'approved' then
      new.approved_at = now();
      new.approved_by = (select auth.uid());
    else
      new.approved_at = null;
      new.approved_by = null;
    end if;
  end if;
  return new;
end;
$$;

create trigger admin_users_guard before update on public.admin_users
  for each row execute function public.guard_admin_user_update();

-- ──────────────────────────────────────────────
-- RLS: admin_users
-- ──────────────────────────────────────────────
alter table public.admin_users enable row level security;

-- 수정할 수 있는 칸은 이름 · 권한 · 상태뿐 (이메일 · 승인 기록은 트리거만 씀)
grant select on public.admin_users to authenticated;
grant update (name, role, status) on public.admin_users to authenticated;

create policy "본인 계정 읽기" on public.admin_users
  for select to authenticated using (id = (select auth.uid()));

create policy "마스터는 모든 계정 읽기" on public.admin_users
  for select to authenticated using ((select public.is_master()));

create policy "본인 이름 수정" on public.admin_users
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "마스터는 모든 계정 수정" on public.admin_users
  for update to authenticated
  using ((select public.is_master()))
  with check ((select public.is_master()));

-- ──────────────────────────────────────────────
-- RLS: 콘텐츠 — 승인된 계정은 모두 읽고 쓰기 (공개 읽기 정책과 함께 적용)
-- ──────────────────────────────────────────────
grant insert, update, delete on public.themes, public.projects, public.project_themes, public.people
  to authenticated;

create policy "관리자 읽기" on public.themes for select to authenticated using ((select public.is_admin()));
create policy "관리자 추가" on public.themes for insert to authenticated with check ((select public.is_admin()));
create policy "관리자 수정" on public.themes for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "관리자 삭제" on public.themes for delete to authenticated using ((select public.is_admin()));

create policy "관리자 읽기" on public.projects for select to authenticated using ((select public.is_admin()));
create policy "관리자 추가" on public.projects for insert to authenticated with check ((select public.is_admin()));
create policy "관리자 수정" on public.projects for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "관리자 삭제" on public.projects for delete to authenticated using ((select public.is_admin()));

create policy "관리자 읽기" on public.project_themes for select to authenticated using ((select public.is_admin()));
create policy "관리자 추가" on public.project_themes for insert to authenticated with check ((select public.is_admin()));
create policy "관리자 수정" on public.project_themes for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "관리자 삭제" on public.project_themes for delete to authenticated using ((select public.is_admin()));

create policy "관리자 읽기" on public.people for select to authenticated using ((select public.is_admin()));
create policy "관리자 추가" on public.people for insert to authenticated with check ((select public.is_admin()));
create policy "관리자 수정" on public.people for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "관리자 삭제" on public.people for delete to authenticated using ((select public.is_admin()));
