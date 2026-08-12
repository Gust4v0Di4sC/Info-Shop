insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'customer-avatars',
  'customer-avatars',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read customer avatars" on storage.objects;
create policy "public read customer avatars"
on storage.objects for select
using (bucket_id = 'customer-avatars');

drop policy if exists "users upload own customer avatars" on storage.objects;
create policy "users upload own customer avatars"
on storage.objects for insert
with check (
  bucket_id = 'customer-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users update own customer avatars" on storage.objects;
create policy "users update own customer avatars"
on storage.objects for update
using (
  bucket_id = 'customer-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'customer-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users delete own customer avatars" on storage.objects;
create policy "users delete own customer avatars"
on storage.objects for delete
using (
  bucket_id = 'customer-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
