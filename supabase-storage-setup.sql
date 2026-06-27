-- Optional storage helper.
-- This creates the public image bucket for reading images.
-- It does NOT allow anonymous uploads, because custom admin sessions cannot
-- secure Supabase Storage policies by themselves.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ereft-images',
  'ereft-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view Ereft images" on storage.objects;
create policy "Public can view Ereft images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'ereft-images');

drop policy if exists "Admins can upload Ereft images" on storage.objects;
drop policy if exists "Admins can update Ereft images" on storage.objects;
drop policy if exists "Admins can delete Ereft images" on storage.objects;
