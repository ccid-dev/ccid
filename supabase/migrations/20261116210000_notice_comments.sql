-- ══════════════════════════════════════════════
-- 공지사항 댓글 · 반응
--
-- 댓글 (notice_comments)
-- - 승인된 계정이면 누구나 읽고 씁니다.
-- - 본인 댓글만 지우고, 메인테이너는 모든 댓글을 지웁니다.
-- 반응 (notice_reactions)
-- - 공지마다 정해진 이모지(👍 ❤️ 🎉 👀 🙏)를 한 사람이 종류별로 한 번씩 누르고 다시 누르면 취소합니다.
--
-- 일반 멤버는 다른 계정 정보를 읽을 수 없어서, 쓴 사람 이름을 행에 함께 적어 둡니다.
-- (이름을 바꾸면 함께 바뀌고, 계정을 지워도 이름은 남습니다)
-- ══════════════════════════════════════════════

-- ──────────────────────────────────────────────
-- 댓글
-- ──────────────────────────────────────────────
create table public.notice_comments (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.notices (id) on delete cascade,
  author_id uuid references public.admin_users (id) on delete set null,
  author_name text not null default '',
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index notice_comments_notice_idx on public.notice_comments (notice_id, created_at);

-- 쓴 사람은 로그인한 본인으로
create function public.guard_notice_comment_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or pg_trigger_depth() > 1 then
    return new;
  end if;
  new.author_id = (select auth.uid());
  new.author_name = coalesce(
    (select name from public.admin_users where id = (select auth.uid())),
    ''
  );
  return new;
end;
$$;

create trigger notice_comments_guard before insert on public.notice_comments
  for each row execute function public.guard_notice_comment_write();

alter table public.notice_comments enable row level security;

grant select, insert, delete on public.notice_comments to authenticated;

create policy "관리자 읽기" on public.notice_comments
  for select to authenticated using ((select public.is_admin()));
create policy "관리자 쓰기" on public.notice_comments
  for insert to authenticated with check ((select public.is_admin()));
create policy "본인 댓글 · 메인테이너 삭제" on public.notice_comments
  for delete to authenticated
  using ((select public.is_master()) or ((select public.is_admin()) and author_id = (select auth.uid())));

-- ──────────────────────────────────────────────
-- 반응
-- ──────────────────────────────────────────────
create table public.notice_reactions (
  notice_id uuid not null references public.notices (id) on delete cascade,
  user_id uuid not null references public.admin_users (id) on delete cascade,
  user_name text not null default '',
  emoji text not null check (emoji in ('👍', '❤️', '🎉', '👀', '🙏')),
  created_at timestamptz not null default now(),
  primary key (notice_id, user_id, emoji)
);

-- 누른 사람은 로그인한 본인으로
create function public.guard_notice_reaction_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or pg_trigger_depth() > 1 then
    return new;
  end if;
  new.user_id = (select auth.uid());
  new.user_name = coalesce(
    (select name from public.admin_users where id = (select auth.uid())),
    ''
  );
  return new;
end;
$$;

create trigger notice_reactions_guard before insert on public.notice_reactions
  for each row execute function public.guard_notice_reaction_write();

alter table public.notice_reactions enable row level security;

grant select, insert, delete on public.notice_reactions to authenticated;

create policy "관리자 읽기" on public.notice_reactions
  for select to authenticated using ((select public.is_admin()));
create policy "본인 반응 추가" on public.notice_reactions
  for insert to authenticated
  with check ((select public.is_admin()) and user_id = (select auth.uid()));
create policy "본인 반응 취소" on public.notice_reactions
  for delete to authenticated
  using ((select public.is_admin()) and user_id = (select auth.uid()));

-- ──────────────────────────────────────────────
-- 이름 맞추기: 공지 · 댓글 · 반응 모두
-- ──────────────────────────────────────────────
create or replace function public.sync_notice_author_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.name is distinct from old.name then
    update public.notices set author_name = new.name where author_id = new.id;
    update public.notice_comments set author_name = new.name where author_id = new.id;
    update public.notice_reactions set user_name = new.name where user_id = new.id;
  end if;
  return new;
end;
$$;
