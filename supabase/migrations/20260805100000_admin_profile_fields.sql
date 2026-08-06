alter table public.admins
  add column if not exists region text not null default 'Nao informada',
  add column if not exists store_name text not null default 'Nao informada';

update public.admins
set
  region = coalesce(nullif(btrim(region), ''), 'Nao informada'),
  store_name = coalesce(nullif(btrim(store_name), ''), 'Nao informada');

create or replace function public.update_admin_profile(
  region_value text,
  store_name_value text
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

  update public.admins
  set
    region = coalesce(nullif(btrim(region_value), ''), 'Nao informada'),
    store_name = coalesce(nullif(btrim(store_name_value), ''), 'Nao informada')
  where user_id = auth.uid()
    and active = true
  returning * into updated_admin;

  if updated_admin.id is null then
    raise exception 'Administrador ativo nao encontrado.' using errcode = '42501';
  end if;

  return updated_admin;
end;
$$;

grant execute on function public.update_admin_profile(text, text) to authenticated;
