create extension if not exists "pgcrypto";

alter table public.admins
  alter column role set default 'gerente';

update public.admins
set role = 'gerente'
where role is null or role not in ('gerente', 'vendedor', 'estoquista');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'admins_role_allowed'
      and conrelid = 'public.admins'::regclass
  ) then
    alter table public.admins
      add constraint admins_role_allowed check (role in ('gerente', 'vendedor', 'estoquista'));
  end if;
end;
$$;

create or replace function public.current_admin_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select admins.role
  from public.admins
  where admins.user_id = auth.uid()
    and admins.active = true
  limit 1
$$;

create or replace function public.has_admin_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_admin_role() = any(allowed_roles), false)
$$;

grant execute on function public.current_admin_role() to authenticated;
grant execute on function public.has_admin_role(text[]) to authenticated;

drop policy if exists "users read own admin status" on public.admins;
create policy "users read own admin status"
on public.admins for select
using (
  user_id = auth.uid()
  or public.has_admin_role(array['gerente'])
);

drop policy if exists "admins read profiles" on public.users;
create policy "admins read profiles"
on public.users for select
using (
  public.has_admin_role(array['gerente'])
);

drop policy if exists "admins manage products" on public.products;
drop policy if exists "admins insert products" on public.products;
drop policy if exists "admins update products" on public.products;
drop policy if exists "admins delete products" on public.products;

create policy "admins insert products"
on public.products for insert
with check (
  public.has_admin_role(array['gerente', 'estoquista'])
);

create policy "admins update products"
on public.products for update
using (
  public.has_admin_role(array['gerente', 'estoquista'])
)
with check (
  public.has_admin_role(array['gerente', 'estoquista'])
);

create policy "admins delete products"
on public.products for delete
using (
  public.has_admin_role(array['gerente', 'estoquista'])
);

drop policy if exists "admins manage orders" on public.orders;
create policy "admins manage orders"
on public.orders for all
using (
  public.has_admin_role(array['gerente', 'vendedor'])
)
with check (
  public.has_admin_role(array['gerente', 'vendedor'])
);

drop policy if exists "admins manage clients" on public.clients;
create policy "admins manage clients"
on public.clients for all
using (
  public.has_admin_role(array['gerente', 'vendedor'])
)
with check (
  public.has_admin_role(array['gerente', 'vendedor'])
);

drop policy if exists "admins manage deliveries" on public.deliveries;
create policy "admins manage deliveries"
on public.deliveries for all
using (
  public.has_admin_role(array['gerente', 'vendedor'])
)
with check (
  public.has_admin_role(array['gerente', 'vendedor'])
);

drop policy if exists "admins read cart items" on public.cart_items;
create policy "admins read cart items"
on public.cart_items for select
using (
  public.has_admin_role(array['gerente'])
);

create or replace function public.clear_active_offer()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_admin_role(array['gerente', 'vendedor']) then
    raise exception 'Acesso negado para gerenciar ofertas.' using errcode = '42501';
  end if;

  update public.products
  set is_offer = false
  where is_offer = true;
end;
$$;

create or replace function public.set_active_offer(
  product_id text,
  offer_price_value numeric,
  offer_badge_value text,
  offer_ends_at_value timestamptz,
  offer_sold_percent_value integer
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_product public.products;
begin
  if not public.has_admin_role(array['gerente', 'vendedor']) then
    raise exception 'Acesso negado para gerenciar ofertas.' using errcode = '42501';
  end if;

  update public.products
  set is_offer = false
  where is_offer = true;

  update public.products
  set
    is_offer = true,
    is_featured = true,
    offer_price = offer_price_value,
    offer_badge = offer_badge_value,
    offer_ends_at = offer_ends_at_value,
    offer_sold_percent = offer_sold_percent_value
  where id = product_id
  returning * into updated_product;

  if updated_product.id is null then
    raise exception 'Produto nao encontrado.' using errcode = 'P0002';
  end if;

  return updated_product;
end;
$$;

create or replace function public.set_product_featured(
  product_id text,
  featured boolean
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_product public.products;
begin
  if not public.has_admin_role(array['gerente', 'vendedor']) then
    raise exception 'Acesso negado para gerenciar destaques.' using errcode = '42501';
  end if;

  update public.products
  set is_featured = featured
  where id = product_id
  returning * into updated_product;

  if updated_product.id is null then
    raise exception 'Produto nao encontrado.' using errcode = 'P0002';
  end if;

  return updated_product;
end;
$$;

grant execute on function public.clear_active_offer() to authenticated;
grant execute on function public.set_active_offer(text, numeric, text, timestamptz, integer) to authenticated;
grant execute on function public.set_product_featured(text, boolean) to authenticated;

with seed_admins as (
  select *
  from (values
    ('00000000-0000-0000-0000-000000000101'::uuid, 'gerente.admin@infoshop.com', 'Gerente Admin', 'gerente', 'Gerente@2026!'),
    ('00000000-0000-0000-0000-000000000102'::uuid, 'vendedor.admin@infoshop.com', 'Vendedor Admin', 'vendedor', 'Vendedor@2026!'),
    ('00000000-0000-0000-0000-000000000103'::uuid, 'estoque.admin@infoshop.com', 'Estoquista Admin', 'estoquista', 'Estoque@2026!')
  ) as admins(id, email, full_name, role, password)
),
upsert_auth_users as (
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  select
    '00000000-0000-0000-0000-000000000000',
    seed_admins.id,
    'authenticated',
    'authenticated',
    seed_admins.email,
    crypt(seed_admins.password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', seed_admins.full_name, 'name', seed_admins.full_name),
    now(),
    now(),
    '',
    '',
    '',
    ''
  from seed_admins
  on conflict (id) do update
    set email = excluded.email,
        encrypted_password = excluded.encrypted_password,
        email_confirmed_at = coalesce(auth.users.email_confirmed_at, excluded.email_confirmed_at),
        raw_app_meta_data = excluded.raw_app_meta_data,
        raw_user_meta_data = excluded.raw_user_meta_data,
        updated_at = now()
  returning id
),
upsert_identities as (
  insert into auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  select
    gen_random_uuid(),
    seed_admins.id::text,
    seed_admins.id,
    jsonb_build_object('sub', seed_admins.id::text, 'email', seed_admins.email),
    'email',
    now(),
    now(),
    now()
  from seed_admins
  on conflict (provider_id, provider) do update
    set identity_data = excluded.identity_data,
        updated_at = now()
  returning user_id
)
insert into public.users (id, email, full_name)
select seed_admins.id, seed_admins.email, seed_admins.full_name
from seed_admins
on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name;

insert into public.admins (user_id, role, active)
values
  ('00000000-0000-0000-0000-000000000101', 'gerente', true),
  ('00000000-0000-0000-0000-000000000102', 'vendedor', true),
  ('00000000-0000-0000-0000-000000000103', 'estoquista', true)
on conflict (user_id) do update
  set role = excluded.role,
      active = excluded.active;
