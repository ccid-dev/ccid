-- ══════════════════════════════════════════════
-- 사이트 설정 (키-값)
--
-- 사이트 전체에 쓰는 값을 admin 에서 바꿀 수 있게 둡니다.
-- - join_url: Join(참여 · 채용 안내) 버튼이 여는 주소. 비우면 사이트에서 Join 버튼을 숨깁니다.
-- 누구나 읽고, 메인테이너만 고칩니다.
-- ══════════════════════════════════════════════

create table public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

alter table public.site_settings enable row level security;

grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;

create policy "누구나 읽기" on public.site_settings
  for select to anon, authenticated using (true);
create policy "메인테이너 추가" on public.site_settings
  for insert to authenticated with check ((select public.is_master()));
create policy "메인테이너 수정" on public.site_settings
  for update to authenticated
  using ((select public.is_master()))
  with check ((select public.is_master()));

insert into public.site_settings (key, value) values
  ('join_url', 'https://ccid-26-summer.netlify.app/');
