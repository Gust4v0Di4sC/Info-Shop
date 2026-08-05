alter table public.admins
  add column if not exists theme_id text not null default 'corporate',
  add column if not exists store_logo_url text;

update public.admins
set theme_id = 'corporate'
where theme_id is null or theme_id not in ('corporate', 'graphite', 'emerald');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'admins_theme_id_allowed'
      and conrelid = 'public.admins'::regclass
  ) then
    alter table public.admins
      add constraint admins_theme_id_allowed check (theme_id in ('corporate', 'graphite', 'emerald'));
  end if;
end;
$$;

create or replace function public.update_admin_personalization(
  theme_id_value text,
  store_logo_url_value text
)
returns public.admins
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_admin public.admins;
begin
  if auth.uid() is null then
    raise exception 'Sessao nao encontrada.' using errcode = '42501';
  end if;

  if theme_id_value not in ('corporate', 'graphite', 'emerald') then
    raise exception 'Tema administrativo invalido.' using errcode = '22023';
  end if;

  update public.admins
  set
    theme_id = theme_id_value,
    store_logo_url = nullif(btrim(store_logo_url_value), '')
  where user_id = auth.uid()
    and active = true
  returning * into updated_admin;

  if updated_admin.id is null then
    raise exception 'Administrador ativo nao encontrado.' using errcode = '42501';
  end if;

  return updated_admin;
end;
$$;

grant execute on function public.update_admin_personalization(text, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'admin-branding',
  'admin-branding',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read admin branding assets" on storage.objects;
create policy "public read admin branding assets"
on storage.objects for select
using (bucket_id = 'admin-branding');

drop policy if exists "admins upload own branding assets" on storage.objects;
create policy "admins upload own branding assets"
on storage.objects for insert
with check (
  bucket_id = 'admin-branding'
  and public.has_admin_role(array['gerente', 'vendedor', 'estoquista'])
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "admins update own branding assets" on storage.objects;
create policy "admins update own branding assets"
on storage.objects for update
using (
  bucket_id = 'admin-branding'
  and public.has_admin_role(array['gerente', 'vendedor', 'estoquista'])
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'admin-branding'
  and public.has_admin_role(array['gerente', 'vendedor', 'estoquista'])
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "admins delete own branding assets" on storage.objects;
create policy "admins delete own branding assets"
on storage.objects for delete
using (
  bucket_id = 'admin-branding'
  and public.has_admin_role(array['gerente', 'vendedor', 'estoquista'])
  and (storage.foldername(name))[1] = auth.uid()::text
);
