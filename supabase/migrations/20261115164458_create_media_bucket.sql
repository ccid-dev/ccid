-- 이미지 저장소: Supabase Storage 의 공개 버킷 "media"
--
-- - DB 에는 버킷 안의 경로(키)만 저장합니다. 예: "themes/interfaces/3f2a….webp"
--   공개 주소는 앱에서 NEXT_PUBLIC_MEDIA_URL(없으면 Supabase Storage 공개 주소) + 키로 만듭니다.
--   나중에 다른 저장소(R2 등)로 옮길 때는 같은 키로 파일을 복사하고 주소만 바꾸면 됩니다.
-- - 누구나 읽을 수 있고(공개 버킷), 올리기 · 바꾸기 · 지우기는 승인된 admin 계정만 할 수 있습니다.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  10485760, -- 10MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do nothing;

create policy "관리자 media 목록" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));

create policy "관리자 media 올리기" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));

create policy "관리자 media 바꾸기" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (select public.is_admin()))
  with check (bucket_id = 'media' and (select public.is_admin()));

create policy "관리자 media 지우기" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
