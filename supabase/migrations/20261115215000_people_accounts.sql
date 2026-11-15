-- ══════════════════════════════════════════════
-- People ↔ 계정 연결 · 본인 프로필 권한 · 계정 정지
--
-- - People(구성원)은 계정 없이도 있을 수 있고, 마스터가 계정과 이어 줍니다. (한 계정에 하나)
-- - 마스터: People 전체 관리
-- - 일반 멤버: can_edit_profile 권한이 있으면 본인 프로필만 만들고 고칩니다.
--   그룹 · 공개 여부 · 순서 · 계정 연결은 마스터만 정합니다. (트리거가 지킴)
-- - 계정 상태에 '정지(suspended)' 추가
-- ══════════════════════════════════════════════

-- ──────────────────────────────────────────────
-- 계정: 정지 상태 · 본인 프로필 권한
-- ──────────────────────────────────────────────
alter table public.admin_users drop constraint admin_users_status_check;
alter table public.admin_users add constraint admin_users_status_check
  check (status in ('pending', 'approved', 'rejected', 'suspended'));

alter table public.admin_users
  add column can_edit_profile boolean not null default false;   -- 본인 People 프로필을 만들고 고칠 수 있는지

-- 첫 마스터는 본인 프로필도 고칠 수 있게 (마스터는 어차피 People 전체를 관리)
update public.admin_users set can_edit_profile = true where role = 'master';

grant update (name, role, status, can_edit_profile) on public.admin_users to authenticated;

-- 상태 · 권한 · 프로필 권한은 마스터만 바꿈 (자기 상태 · 권한은 못 바꿈)
create or replace function public.guard_admin_user_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- 로그인 세션 밖(SQL 편집기, secret key)에서의 수정은 운영자 작업으로 보고 그대로 허용합니다.
  if (select auth.uid()) is null then
    return new;
  end if;

  if new.role is distinct from old.role
    or new.status is distinct from old.status
    or new.can_edit_profile is distinct from old.can_edit_profile then
    if not public.is_master() then
      raise exception '계정 상태와 권한은 마스터만 바꿀 수 있습니다.' using errcode = '42501';
    end if;
  end if;

  if new.role is distinct from old.role or new.status is distinct from old.status then
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

-- ──────────────────────────────────────────────
-- People ↔ 계정
-- ──────────────────────────────────────────────
alter table public.people
  add column admin_user_id uuid unique references public.admin_users (id) on delete set null;

-- 본인 프로필을 고칠 수 있는 승인된 계정인지
create function public.can_edit_own_profile()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where id = (select auth.uid()) and status = 'approved' and can_edit_profile
  );
$$;

revoke execute on function public.can_edit_own_profile() from public, anon;
grant execute on function public.can_edit_own_profile() to authenticated;

-- 일반 멤버가 쓰면: 계정 연결은 본인으로, 공개 여부 · 순서 · 그룹은 마스터 몫으로 고정
create function public.guard_people_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- 운영자 작업 · 마스터 · 계정 삭제에 따른 연결 해제(외래 키 동작, 트리거 깊이 > 1)는 그대로 둡니다.
  if (select auth.uid()) is null or public.is_master() or pg_trigger_depth() > 1 then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.admin_user_id = (select auth.uid());
    new.is_published = false;
    new.sort_order = 0;
  else
    new.admin_user_id = old.admin_user_id;
    new.is_published = old.is_published;
    new.sort_order = old.sort_order;
    new.category = old.category;
  end if;
  return new;
end;
$$;

create trigger people_guard before insert or update on public.people
  for each row execute function public.guard_people_write();

-- 읽기("관리자 읽기")는 그대로, 쓰기는 마스터 전체 + 본인 프로필
drop policy "관리자 추가" on public.people;
drop policy "관리자 수정" on public.people;
drop policy "관리자 삭제" on public.people;

create policy "마스터 추가" on public.people
  for insert to authenticated with check ((select public.is_master()));
create policy "마스터 수정" on public.people
  for update to authenticated
  using ((select public.is_master()))
  with check ((select public.is_master()));
create policy "마스터 삭제" on public.people
  for delete to authenticated using ((select public.is_master()));

create policy "본인 프로필 추가" on public.people
  for insert to authenticated
  with check ((select public.can_edit_own_profile()) and admin_user_id = (select auth.uid()));
create policy "본인 프로필 수정" on public.people
  for update to authenticated
  using ((select public.can_edit_own_profile()) and admin_user_id = (select auth.uid()))
  with check ((select public.can_edit_own_profile()) and admin_user_id = (select auth.uid()));
