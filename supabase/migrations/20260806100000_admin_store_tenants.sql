create table if not exists public.stores (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  region text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists stores_region_name_key
  on public.stores (region, name);

drop trigger if exists stores_set_updated_at on public.stores;
create trigger stores_set_updated_at
before update on public.stores
for each row execute function public.set_updated_at();

insert into public.stores (id, name, region, active)
values
  ('00000000-0000-0000-0000-000000000201', 'InfoShop Centro', 'Sudeste', true),
  ('00000000-0000-0000-0000-000000000202', 'InfoShop Norte', 'Sudeste', true),
  ('00000000-0000-0000-0000-000000000203', 'InfoShop Sul', 'Sul', true)
on conflict (id) do update
  set name = excluded.name,
      region = excluded.region,
      active = excluded.active;

insert into public.stores (name, region, active)
select distinct
  coalesce(nullif(btrim(admins.store_name), ''), 'InfoShop Centro'),
  coalesce(nullif(btrim(admins.region), ''), 'Sudeste'),
  true
from public.admins admins
where coalesce(nullif(btrim(admins.store_name), ''), 'Nao informada') <> 'Nao informada'
  and coalesce(nullif(btrim(admins.region), ''), 'Nao informada') <> 'Nao informada'
on conflict (region, name) do nothing;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'admins_role_allowed'
      and conrelid = 'public.admins'::regclass
  ) then
    alter table public.admins drop constraint admins_role_allowed;
  end if;

  alter table public.admins
    add constraint admins_role_allowed check (role in ('gerente', 'gerente_regional', 'vendedor', 'estoquista'));
end;
$$;

update public.admins
set
  role = 'gerente_regional',
  region = 'Sudeste',
  store_name = 'Regional Sudeste'
where user_id = '00000000-0000-0000-0000-000000000101';

update public.admins
set
  region = 'Sudeste',
  store_name = 'InfoShop Centro'
where user_id in (
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000103'
);

create table if not exists public.admin_store_accesses (
  admin_id text not null references public.admins(id) on delete cascade,
  store_id text not null references public.stores(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (admin_id, store_id)
);

insert into public.admin_store_accesses (admin_id, store_id)
select admins.id, stores.id
from public.admins admins
join public.stores stores
  on stores.region = admins.region
where admins.role = 'gerente_regional'
  and admins.active = true
  and stores.active = true
on conflict do nothing;

insert into public.admin_store_accesses (admin_id, store_id)
select admins.id, stores.id
from public.admins admins
join public.stores stores
  on stores.region = admins.region
 and stores.name = admins.store_name
where admins.role in ('gerente', 'vendedor', 'estoquista')
  and admins.active = true
  and stores.active = true
on conflict do nothing;

insert into public.admin_store_accesses (admin_id, store_id)
select admins.id, stores.id
from public.admins admins
join public.stores stores
  on stores.id in (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202'
  )
where admins.user_id = '00000000-0000-0000-0000-000000000103'
on conflict do nothing;

alter table public.products
  add column if not exists store_id text references public.stores(id) default '00000000-0000-0000-0000-000000000201';

alter table public.clients
  add column if not exists store_id text references public.stores(id) default '00000000-0000-0000-0000-000000000201';

alter table public.orders
  add column if not exists store_id text references public.stores(id) default '00000000-0000-0000-0000-000000000201';

alter table public.deliveries
  add column if not exists store_id text references public.stores(id) default '00000000-0000-0000-0000-000000000201';

update public.products
set store_id = '00000000-0000-0000-0000-000000000201'
where store_id is null;

update public.clients
set store_id = '00000000-0000-0000-0000-000000000201'
where store_id is null;

update public.orders
set store_id = '00000000-0000-0000-0000-000000000201'
where store_id is null;

update public.deliveries
set store_id = coalesce(
  (
    select orders.store_id
    from public.orders orders
    where orders.id::text = deliveries.order_id::text
    limit 1
  ),
  '00000000-0000-0000-0000-000000000201'
)
where store_id is null;

alter table public.products
  alter column store_id set not null;

alter table public.clients
  alter column store_id set not null;

alter table public.orders
  alter column store_id set not null;

alter table public.deliveries
  alter column store_id set not null;

create index if not exists products_store_id_idx on public.products (store_id);
create index if not exists clients_store_id_idx on public.clients (store_id);
create index if not exists orders_store_id_idx on public.orders (store_id);
create index if not exists deliveries_store_id_idx on public.deliveries (store_id);

alter table public.stores enable row level security;
alter table public.admin_store_accesses enable row level security;

create or replace function public.current_admin()
returns public.admins
language sql
stable
security definer
set search_path = public
as $$
  select admins.*
  from public.admins
  where admins.user_id = auth.uid()
    and admins.active = true
  limit 1
$$;

create or replace function public.current_admin_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select (public.current_admin()).role
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

create or replace function public.has_store_access(store_id_value text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins admins
    join public.stores stores
      on stores.id = store_id_value
     and stores.active = true
    where admins.user_id = auth.uid()
      and admins.active = true
      and (
        (admins.role = 'gerente_regional' and stores.region = admins.region)
        or exists (
          select 1
          from public.admin_store_accesses access
          where access.admin_id = admins.id
            and access.store_id = store_id_value
        )
      )
  )
$$;

create or replace function public.get_current_admin_stores()
returns table (
  id text,
  name text,
  region text
)
language sql
stable
security definer
set search_path = public
as $$
  with current_admin as (
    select admins.*
    from public.admins admins
    where admins.user_id = auth.uid()
      and admins.active = true
    limit 1
  ),
  accessible_stores as (
    select stores.id, stores.name, stores.region
    from current_admin
    join public.stores stores
      on stores.active = true
     and current_admin.role = 'gerente_regional'
     and stores.region = current_admin.region

    union

    select stores.id, stores.name, stores.region
    from current_admin
    join public.admin_store_accesses access
      on access.admin_id = current_admin.id
    join public.stores stores
      on stores.id = access.store_id
     and stores.active = true
    where current_admin.role <> 'gerente_regional'
  )
  select accessible_stores.id, accessible_stores.name, accessible_stores.region
  from accessible_stores
  where not exists (select 1 from current_admin where role = 'vendedor')
     or accessible_stores.id = (
       select stores.id
       from current_admin
       join public.stores stores
         on stores.region = current_admin.region
        and stores.name = current_admin.store_name
        and stores.active = true
       limit 1
     )
  order by accessible_stores.region, accessible_stores.name
$$;

grant execute on function public.current_admin() to authenticated;
grant execute on function public.current_admin_role() to authenticated;
grant execute on function public.has_admin_role(text[]) to authenticated;
grant execute on function public.has_store_access(text) to authenticated;
grant execute on function public.get_current_admin_stores() to authenticated;

drop policy if exists "admins read stores" on public.stores;
create policy "admins read stores"
on public.stores for select
using (public.has_store_access(id));

drop policy if exists "admins read store accesses" on public.admin_store_accesses;
create policy "admins read store accesses"
on public.admin_store_accesses for select
using (
  exists (
    select 1
    from public.admins admins
    where admins.id = admin_store_accesses.admin_id
      and admins.user_id = auth.uid()
      and admins.active = true
  )
  or public.has_admin_role(array['gerente', 'gerente_regional'])
);

drop policy if exists "users read own admin status" on public.admins;
create policy "users read own admin status"
on public.admins for select
using (
  user_id = auth.uid()
  or public.has_admin_role(array['gerente', 'gerente_regional'])
);

drop policy if exists "admins read profiles" on public.users;
create policy "admins read profiles"
on public.users for select
using (
  public.has_admin_role(array['gerente', 'gerente_regional'])
);

drop policy if exists "admins insert products" on public.products;
drop policy if exists "admins update products" on public.products;
drop policy if exists "admins delete products" on public.products;

create policy "admins insert products"
on public.products for insert
with check (
  public.has_admin_role(array['gerente', 'gerente_regional', 'estoquista'])
  and public.has_store_access(store_id)
);

create policy "admins update products"
on public.products for update
using (
  public.has_admin_role(array['gerente', 'gerente_regional', 'estoquista'])
  and public.has_store_access(store_id)
)
with check (
  public.has_admin_role(array['gerente', 'gerente_regional', 'estoquista'])
  and public.has_store_access(store_id)
);

create policy "admins delete products"
on public.products for delete
using (
  public.has_admin_role(array['gerente', 'gerente_regional', 'estoquista'])
  and public.has_store_access(store_id)
);

drop policy if exists "admins manage orders" on public.orders;
create policy "admins manage orders"
on public.orders for all
using (
  public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor'])
  and public.has_store_access(store_id)
)
with check (
  public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor'])
  and public.has_store_access(store_id)
);

drop policy if exists "admins manage clients" on public.clients;
create policy "admins manage clients"
on public.clients for all
using (
  public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor'])
  and public.has_store_access(store_id)
)
with check (
  public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor'])
  and public.has_store_access(store_id)
);

drop policy if exists "admins manage deliveries" on public.deliveries;
create policy "admins manage deliveries"
on public.deliveries for all
using (
  public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor'])
  and public.has_store_access(store_id)
)
with check (
  public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor'])
  and public.has_store_access(store_id)
);

drop policy if exists "admins read cart items" on public.cart_items;
create policy "admins read cart items"
on public.cart_items for select
using (
  public.has_admin_role(array['gerente', 'gerente_regional'])
);

drop policy if exists "admins upload own branding assets" on storage.objects;
create policy "admins upload own branding assets"
on storage.objects for insert
with check (
  bucket_id = 'admin-branding'
  and public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor', 'estoquista'])
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "admins update own branding assets" on storage.objects;
create policy "admins update own branding assets"
on storage.objects for update
using (
  bucket_id = 'admin-branding'
  and public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor', 'estoquista'])
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'admin-branding'
  and public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor', 'estoquista'])
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "admins delete own branding assets" on storage.objects;
create policy "admins delete own branding assets"
on storage.objects for delete
using (
  bucket_id = 'admin-branding'
  and public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor', 'estoquista'])
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.handle_new_order_delivery()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.deliveries (order_id, user_id, customer_name, address, status, store_id)
  values (
    new.id::text,
    public.parse_uuid(new."userId"),
    new.name,
    new.address,
    case
      when new.status = 'delivered' then 'delivered'
      when new.status = 'canceled' then 'canceled'
      when new.status = 'shipped' then 'shipped'
      else 'pending'
    end,
    new.store_id
  )
  on conflict (order_id) do nothing;

  return new;
end;
$$;

drop function if exists public.clear_active_offer();
drop function if exists public.set_active_offer(text, numeric, text, timestamptz, integer);
drop function if exists public.set_product_featured(text, boolean);

create or replace function public.clear_active_offer(store_id_value text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor']) then
    raise exception 'Acesso negado para gerenciar ofertas.' using errcode = '42501';
  end if;

  if not public.has_store_access(store_id_value) then
    raise exception 'Acesso negado para esta loja.' using errcode = '42501';
  end if;

  update public.products
  set is_offer = false
  where is_offer = true
    and store_id = store_id_value;
end;
$$;

create or replace function public.set_active_offer(
  product_id text,
  offer_price_value numeric,
  offer_badge_value text,
  offer_ends_at_value timestamptz,
  offer_sold_percent_value integer,
  store_id_value text
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_product public.products;
begin
  if not public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor']) then
    raise exception 'Acesso negado para gerenciar ofertas.' using errcode = '42501';
  end if;

  if not public.has_store_access(store_id_value) then
    raise exception 'Acesso negado para esta loja.' using errcode = '42501';
  end if;

  update public.products
  set is_offer = false
  where is_offer = true
    and store_id = store_id_value;

  update public.products
  set
    is_offer = true,
    is_featured = true,
    offer_price = offer_price_value,
    offer_badge = offer_badge_value,
    offer_ends_at = offer_ends_at_value,
    offer_sold_percent = offer_sold_percent_value
  where id = product_id
    and store_id = store_id_value
  returning * into updated_product;

  if updated_product.id is null then
    raise exception 'Produto nao encontrado nesta loja.' using errcode = 'P0002';
  end if;

  return updated_product;
end;
$$;

create or replace function public.set_product_featured(
  product_id text,
  featured boolean,
  store_id_value text
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_product public.products;
begin
  if not public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor']) then
    raise exception 'Acesso negado para gerenciar destaques.' using errcode = '42501';
  end if;

  if not public.has_store_access(store_id_value) then
    raise exception 'Acesso negado para esta loja.' using errcode = '42501';
  end if;

  update public.products
  set is_featured = featured
  where id = product_id
    and store_id = store_id_value
  returning * into updated_product;

  if updated_product.id is null then
    raise exception 'Produto nao encontrado nesta loja.' using errcode = 'P0002';
  end if;

  return updated_product;
end;
$$;

grant execute on function public.clear_active_offer(text) to authenticated;
grant execute on function public.set_active_offer(text, numeric, text, timestamptz, integer, text) to authenticated;
grant execute on function public.set_product_featured(text, boolean, text) to authenticated;
