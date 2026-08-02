create extension if not exists "pgcrypto";

create table if not exists public.products (
  id text primary key default gen_random_uuid()::text
);

alter table public.products
  add column if not exists name text not null default '',
  add column if not exists model text,
  add column if not exists price numeric(12, 2) not null default 0,
  add column if not exists cost numeric(12, 2) not null default 0,
  add column if not exists description text not null default '',
  add column if not exists "imageUrl" text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.clients (
  id text primary key default gen_random_uuid()::text
);

alter table public.clients
  add column if not exists name text not null default '',
  add column if not exists age integer not null default 0,
  add column if not exists address text not null default '',
  add column if not exists cpf text not null default '',
  add column if not exists cnpj text,
  add column if not exists "imageUrl" text,
  add column if not exists phone numeric,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade
);

alter table public.users
  add column if not exists email text not null default '',
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists document text,
  add column if not exists address text,
  add column if not exists avatar_url text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.admins (
  id text primary key default gen_random_uuid()::text
);

alter table public.admins
  add column if not exists user_id uuid references public.users(id) on delete cascade,
  add column if not exists role text not null default 'admin',
  add column if not exists active boolean not null default true,
  add column if not exists created_at timestamptz not null default now();

create unique index if not exists admins_user_id_key
  on public.admins (user_id);

create table if not exists public.orders (
  id text primary key default gen_random_uuid()::text
);

alter table public.orders
  add column if not exists "clientId" text,
  add column if not exists name text not null default '',
  add column if not exists "userId" text,
  add column if not exists address text not null default '',
  add column if not exists "productId" text,
  add column if not exists product text not null default '',
  add column if not exists "imageProd" text,
  add column if not exists "imageClient" text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.cart_items (
  id text primary key default gen_random_uuid()::text
);

alter table public.cart_items
  add column if not exists user_id uuid references public.users(id) on delete cascade,
  add column if not exists product_id text not null,
  add column if not exists quantity integer not null default 1,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cart_items_quantity_positive'
      and conrelid = 'public.cart_items'::regclass
  ) then
    alter table public.cart_items
      add constraint cart_items_quantity_positive check (quantity > 0);
  end if;
end;
$$;

create unique index if not exists cart_items_user_product_key
  on public.cart_items (user_id, product_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists cart_items_set_updated_at on public.cart_items;
create trigger cart_items_set_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.users.full_name, excluded.full_name),
        avatar_url = coalesce(public.users.avatar_url, excluded.avatar_url);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

insert into public.users (id, email, full_name, avatar_url)
select
  auth_users.id,
  coalesce(auth_users.email, ''),
  coalesce(auth_users.raw_user_meta_data->>'full_name', auth_users.raw_user_meta_data->>'name'),
  coalesce(auth_users.raw_user_meta_data->>'avatar_url', auth_users.raw_user_meta_data->>'picture')
from auth.users auth_users
on conflict (id) do nothing;

alter table public.products enable row level security;
alter table public.clients enable row level security;
alter table public.users enable row level security;
alter table public.admins enable row level security;
alter table public.orders enable row level security;
alter table public.cart_items enable row level security;

drop policy if exists "products are visible to everyone" on public.products;
create policy "products are visible to everyone"
on public.products for select
using (true);

drop policy if exists "admins manage products" on public.products;
create policy "admins manage products"
on public.products for all
using (
  exists (
    select 1 from public.admins
    where admins.user_id = auth.uid()
      and admins.active = true
  )
)
with check (
  exists (
    select 1 from public.admins
    where admins.user_id = auth.uid()
      and admins.active = true
  )
);

drop policy if exists "users manage own profile" on public.users;
create policy "users manage own profile"
on public.users for all
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "admins read profiles" on public.users;
create policy "admins read profiles"
on public.users for select
using (
  exists (
    select 1 from public.admins
    where admins.user_id = auth.uid()
      and admins.active = true
  )
);

drop policy if exists "users read own admin status" on public.admins;
create policy "users read own admin status"
on public.admins for select
using (user_id = auth.uid());

drop policy if exists "users manage own cart" on public.cart_items;
create policy "users manage own cart"
on public.cart_items for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users read own orders" on public.orders;
create policy "users read own orders"
on public.orders for select
using ("userId"::text = auth.uid()::text);

drop policy if exists "admins manage orders" on public.orders;
create policy "admins manage orders"
on public.orders for all
using (
  exists (
    select 1 from public.admins
    where admins.user_id = auth.uid()
      and admins.active = true
  )
)
with check (
  exists (
    select 1 from public.admins
    where admins.user_id = auth.uid()
      and admins.active = true
  )
);

drop policy if exists "admins manage clients" on public.clients;
create policy "admins manage clients"
on public.clients for all
using (
  exists (
    select 1 from public.admins
    where admins.user_id = auth.uid()
      and admins.active = true
  )
)
with check (
  exists (
    select 1 from public.admins
    where admins.user_id = auth.uid()
      and admins.active = true
  )
);
