-- ══════════════════════════════════════════════
-- 프로젝트 주소(slug)
--
-- 사이트에서 프로젝트 모달을 링크로 공유할 때 씁니다: /projects#<slug>
-- 비워 두면 영문 제목으로 자동으로 만듭니다. (겹치면 -2, -3 …)
-- ══════════════════════════════════════════════

alter table public.projects add column slug text;

-- slug 가 비어 있으면 영문 제목으로 만들어 채움 (새로 만들기 · seed · 기존 행)
create function public.set_project_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  base text;
  candidate text;
  n integer := 1;
begin
  if coalesce(new.slug, '') <> '' then
    return new;
  end if;

  base := regexp_replace(lower(coalesce(new.title_en, '')), '[^a-z0-9]+', '-', 'g');
  base := trim(both '-' from left(trim(both '-' from base), 60));
  if base = '' then
    base := 'project';
  end if;

  candidate := base;
  while exists (select 1 from public.projects where slug = candidate and id <> new.id) loop
    n := n + 1;
    candidate := base || '-' || n;
  end loop;

  new.slug := candidate;
  return new;
end;
$$;

create trigger projects_slug before insert or update on public.projects
  for each row execute function public.set_project_slug();

-- 기존 프로젝트 채우기 (만든 순서대로 한 줄씩 — 겹치는 이름은 나중 것에 -2). 수정 시각은 그대로 둡니다.
alter table public.projects disable trigger projects_updated_at;
do $$
declare
  r record;
begin
  for r in select id from public.projects where slug is null order by created_at, id loop
    update public.projects set slug = null where id = r.id;
  end loop;
end;
$$;
alter table public.projects enable trigger projects_updated_at;

alter table public.projects
  alter column slug set not null,
  add constraint projects_slug_key unique (slug),
  add constraint projects_slug_check check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
