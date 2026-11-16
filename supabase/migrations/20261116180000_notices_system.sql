-- ══════════════════════════════════════════════
-- 공지사항 · System Check 사용량
--
-- 공지사항 (notices)
-- - 승인된 계정이면 누구나 읽고 씁니다.
-- - 고정(pinned)은 메인테이너만 정합니다. (트리거가 지킴)
-- - 메인테이너는 모든 글을, 일반 멤버는 본인 글만 고치고 지웁니다.
-- - 일반 멤버는 다른 계정 정보를 읽을 수 없어서, 글쓴이 이름을 글에 함께 적어 둡니다.
--   (이름을 바꾸면 그 사람 글의 이름도 함께 바뀌고, 계정을 지워도 이름은 남습니다)
--
-- System Check (system_usage)
-- - DB 크기 · Storage 사용량 · 계정 수 · 표별 행 수를 메인테이너에게만 돌려줍니다.
-- ══════════════════════════════════════════════

-- ──────────────────────────────────────────────
-- 공지사항
-- ──────────────────────────────────────────────
create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '',
  pinned boolean not null default false,
  author_id uuid references public.admin_users (id) on delete set null,
  author_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notices_list_idx on public.notices (pinned desc, created_at desc);

create trigger notices_updated_at before update on public.notices
  for each row execute function public.set_updated_at();

-- 글쓴이는 로그인한 본인으로, 고정은 메인테이너만
create function public.guard_notice_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- 운영자 작업 · 계정 삭제(외래 키) · 이름 맞추기(트리거 깊이 > 1)는 그대로 둡니다.
  if (select auth.uid()) is null or pg_trigger_depth() > 1 then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.author_id = (select auth.uid());
    new.author_name = coalesce(
      (select name from public.admin_users where id = (select auth.uid())),
      ''
    );
    if not public.is_master() then
      new.pinned = false;
    end if;
  else
    new.author_id = old.author_id;
    new.author_name = old.author_name;
    if not public.is_master() then
      new.pinned = old.pinned;
    end if;
  end if;
  return new;
end;
$$;

create trigger notices_guard before insert or update on public.notices
  for each row execute function public.guard_notice_write();

-- 계정 이름을 바꾸면 그 사람 글의 글쓴이 이름도 맞춤
create function public.sync_notice_author_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.name is distinct from old.name then
    update public.notices set author_name = new.name where author_id = new.id;
  end if;
  return new;
end;
$$;

create trigger admin_users_sync_notice_author after update of name on public.admin_users
  for each row execute function public.sync_notice_author_name();

alter table public.notices enable row level security;

grant select, insert, update, delete on public.notices to authenticated;

create policy "관리자 읽기" on public.notices
  for select to authenticated using ((select public.is_admin()));
create policy "관리자 쓰기" on public.notices
  for insert to authenticated with check ((select public.is_admin()));
create policy "본인 글 · 메인테이너 수정" on public.notices
  for update to authenticated
  using ((select public.is_master()) or ((select public.is_admin()) and author_id = (select auth.uid())))
  with check ((select public.is_master()) or ((select public.is_admin()) and author_id = (select auth.uid())));
create policy "본인 글 · 메인테이너 삭제" on public.notices
  for delete to authenticated
  using ((select public.is_master()) or ((select public.is_admin()) and author_id = (select auth.uid())));

-- ──────────────────────────────────────────────
-- System Check: 사용량 (메인테이너만)
-- ──────────────────────────────────────────────
create function public.system_usage()
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_master() then
    raise exception '메인테이너만 볼 수 있습니다.' using errcode = '42501';
  end if;

  return json_build_object(
    'database_bytes', pg_database_size(current_database()),
    'storage_bytes', (select coalesce(sum((metadata ->> 'size')::bigint), 0) from storage.objects),
    'storage_objects', (select count(*) from storage.objects),
    'auth_users', (select count(*) from auth.users),
    'tables', json_build_object(
      'themes', (select count(*) from public.themes),
      'projects', (select count(*) from public.projects),
      'people', (select count(*) from public.people),
      'admin_users', (select count(*) from public.admin_users),
      'notices', (select count(*) from public.notices)
    )
  );
end;
$$;

revoke execute on function public.system_usage() from public, anon;
grant execute on function public.system_usage() to authenticated;
