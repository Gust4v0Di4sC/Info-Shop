alter table public.products
  add column if not exists stock_quantity integer not null default 0,
  add column if not exists stock_reserved integer not null default 0,
  add column if not exists stock_minimum integer not null default 0,
  add column if not exists is_featured boolean not null default false,
  add column if not exists is_offer boolean not null default false,
  add column if not exists offer_price numeric(12, 2),
  add column if not exists offer_badge text not null default 'Oferta por tempo limitado',
  add column if not exists offer_ends_at timestamptz,
  add column if not exists offer_sold_percent integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_stock_quantity_non_negative'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_stock_quantity_non_negative check (stock_quantity >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'products_stock_reserved_non_negative'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_stock_reserved_non_negative check (stock_reserved >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'products_stock_minimum_non_negative'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_stock_minimum_non_negative check (stock_minimum >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'products_offer_sold_percent_range'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_offer_sold_percent_range check (
        offer_sold_percent >= 0 and offer_sold_percent <= 100
      );
  end if;
end;
$$;

alter table public.orders
  add column if not exists status text not null default 'open',
  add column if not exists quantity integer not null default 1,
  add column if not exists total_amount numeric(12, 2) not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_quantity_positive'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_quantity_positive check (quantity > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_status_allowed'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_status_allowed check (
        status in ('open', 'confirmed', 'preparing', 'shipped', 'delivered', 'canceled')
      );
  end if;
end;
$$;

create table if not exists public.deliveries (
  id text primary key default gen_random_uuid()::text,
  order_id text,
  user_id uuid references public.users(id) on delete set null,
  customer_name text not null default '',
  address text not null default '',
  status text not null default 'pending',
  tracking_code text,
  carrier text,
  estimated_delivery_date date,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists deliveries_order_id_key
  on public.deliveries (order_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'deliveries_status_allowed'
      and conrelid = 'public.deliveries'::regclass
  ) then
    alter table public.deliveries
      add constraint deliveries_status_allowed check (
        status in ('pending', 'preparing', 'shipped', 'out_for_delivery', 'delivered', 'canceled')
      );
  end if;
end;
$$;

drop trigger if exists deliveries_set_updated_at on public.deliveries;
create trigger deliveries_set_updated_at
before update on public.deliveries
for each row execute function public.set_updated_at();

create or replace function public.parse_uuid(value text)
returns uuid
language plpgsql
immutable
as $$
begin
  if value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return value::uuid;
  end if;

  return null;
end;
$$;

create or replace function public.handle_new_order_delivery()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.deliveries (order_id, user_id, customer_name, address, status)
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
    end
  )
  on conflict (order_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_order_created_create_delivery on public.orders;
create trigger on_order_created_create_delivery
after insert on public.orders
for each row execute function public.handle_new_order_delivery();

insert into public.deliveries (order_id, user_id, customer_name, address, status)
select
  orders.id::text,
  public.parse_uuid(orders."userId"),
  orders.name,
  orders.address,
  case
    when orders.status = 'delivered' then 'delivered'
    when orders.status = 'canceled' then 'canceled'
    when orders.status = 'shipped' then 'shipped'
    else 'pending'
  end
from public.orders orders
on conflict (order_id) do nothing;

alter table public.deliveries enable row level security;

drop policy if exists "users read own deliveries" on public.deliveries;
create policy "users read own deliveries"
on public.deliveries for select
using (user_id = auth.uid());

drop policy if exists "admins manage deliveries" on public.deliveries;
create policy "admins manage deliveries"
on public.deliveries for all
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
