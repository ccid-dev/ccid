-- ══════════════════════════════════════════════
-- 모집(Recruit) 설정
--
-- 사이트 Join 구역의 문구와 버튼 동작을 admin(Recruit)에서 관리합니다. 한 줄짜리 표입니다.
-- - 모집 중(is_open): Join 버튼이 지원 링크(apply_url)를 엽니다.
-- - 모집 중이 아님: Join 버튼을 누르면 closed_* 문구가 모달로 뜹니다.
-- 누구나 읽고, 메인테이너만 고칩니다.
--
-- 이전의 site_settings(join_url 하나)는 이 표로 옮기고 지웁니다.
-- ══════════════════════════════════════════════

create table public.recruit (
  id smallint primary key default 1 check (id = 1),               -- 한 줄만
  is_open boolean not null default false,                         -- 모집 중인지
  apply_url text not null default '',                             -- 지원 링크 (모집 중일 때 버튼이 여는 주소)
  eyebrow_ko text not null default '',                            -- Join 구역 작은 제목
  eyebrow_en text not null default '',
  title_ko text not null default '',                              -- 큰 문구
  title_en text not null default '',
  description_ko text not null default '',                        -- 설명
  description_en text not null default '',
  cta_ko text not null default '',                                -- 버튼 글자
  cta_en text not null default '',
  closed_title_ko text not null default '',                       -- 모집 중이 아닐 때 모달 제목
  closed_title_en text not null default '',
  closed_message_ko text not null default '',                     -- 모집 중이 아닐 때 모달 내용
  closed_message_en text not null default '',
  updated_at timestamptz not null default now(),
  -- 모집 중이면 지원 링크가 있어야 함
  constraint recruit_open_needs_url check (not is_open or apply_url ~ '^https?://')
);

create trigger recruit_updated_at before update on public.recruit
  for each row execute function public.set_updated_at();

alter table public.recruit enable row level security;

grant select on public.recruit to anon, authenticated;
grant insert, update on public.recruit to authenticated;

create policy "누구나 읽기" on public.recruit
  for select to anon, authenticated using (true);
create policy "메인테이너 추가" on public.recruit
  for insert to authenticated with check ((select public.is_master()));
create policy "메인테이너 수정" on public.recruit
  for update to authenticated
  using ((select public.is_master()))
  with check ((select public.is_master()));

-- 지금 문구와 링크로 시작 (링크가 있으면 모집 중)
insert into public.recruit (
  is_open, apply_url,
  eyebrow_ko, eyebrow_en,
  title_ko, title_en,
  description_ko, description_en,
  cta_ko, cta_en,
  closed_title_ko, closed_title_en,
  closed_message_ko, closed_message_en
)
select
  coalesce(link.value, '') ~ '^https?://',
  coalesce(link.value, ''),
  'Join the inquiry', 'Join the inquiry',
  '새로운 관점을 기다립니다.', 'We’re curious about your perspective.',
  'cciD의 인턴십과 참여 기회를 안내합니다.', 'Explore information about internships and opportunities at cciD.',
  '참여 및 채용 안내', 'Opportunities at cciD',
  '지금은 모집 기간이 아닙니다', 'We’re not recruiting right now',
  '다음 모집이 열리면 이곳에서 안내해 드립니다.', 'We’ll share details here when the next round opens.'
from (select 1) as one
left join public.site_settings as link on link.key = 'join_url';

drop table public.site_settings;
