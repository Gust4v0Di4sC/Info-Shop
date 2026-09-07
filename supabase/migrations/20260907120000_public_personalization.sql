create or replace function public.get_public_personalization()
returns table (
  theme_id text,
  store_logo_url text
)
language sql
security definer
set search_path = public
as $$
  select
    admins.theme_id,
    admins.store_logo_url
  from public.admins admins
  where admins.active = true
    and nullif(btrim(admins.store_logo_url), '') is not null
  order by admins.created_at desc
  limit 1;
$$;

revoke all on function public.get_public_personalization() from public;
grant execute on function public.get_public_personalization() to anon, authenticated;
