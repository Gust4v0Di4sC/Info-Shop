alter table public.orders
  drop constraint if exists orders_status_allowed;

alter table public.orders
  add constraint orders_status_allowed check (
    status in (
      'open',
      'payment_pending',
      'payment_failed',
      'confirmed',
      'preparing',
      'shipped',
      'delivered',
      'canceled'
    )
  );

create or replace function public.handle_new_order_delivery()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('payment_pending', 'payment_failed') then
    return new;
  end if;

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
      when new.status in ('confirmed', 'preparing') then 'preparing'
      else 'pending'
    end,
    new.store_id
  )
  on conflict (order_id) do nothing;

  return new;
end;
$$;

create table if not exists public.order_items (
  id text primary key default gen_random_uuid()::text,
  order_id text not null,
  product_id text not null,
  store_id text not null,
  product_name text not null,
  product_image_url text,
  quantity integer not null,
  unit_price numeric(12, 2) not null,
  total_amount numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_items_quantity_positive'
      and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_quantity_positive check (quantity > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_items_amounts_non_negative'
      and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_amounts_non_negative check (
        unit_price >= 0 and total_amount >= 0
      );
  end if;
end;
$$;

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_store_id_idx on public.order_items (store_id);

create table if not exists public.payments (
  id text primary key default gen_random_uuid()::text,
  order_id text not null,
  store_id text not null,
  user_id uuid references public.users(id) on delete set null,
  provider text not null default 'mercado_pago',
  preference_id text,
  payment_id text,
  external_reference text not null,
  status text not null default 'pending',
  status_detail text,
  amount numeric(12, 2) not null default 0,
  currency text not null default 'BRL',
  init_point text,
  sandbox_init_point text,
  payer_email text,
  payment_method_id text,
  payment_type_id text,
  approved_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payments_provider_allowed'
      and conrelid = 'public.payments'::regclass
  ) then
    alter table public.payments
      add constraint payments_provider_allowed check (provider in ('mercado_pago'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'payments_status_allowed'
      and conrelid = 'public.payments'::regclass
  ) then
    alter table public.payments
      add constraint payments_status_allowed check (
        status in (
          'pending',
          'in_process',
          'approved',
          'authorized',
          'rejected',
          'cancelled',
          'refunded',
          'charged_back',
          'failed'
        )
      );
  end if;
end;
$$;

create unique index if not exists payments_external_reference_key
  on public.payments (external_reference);

create unique index if not exists payments_preference_id_key
  on public.payments (preference_id)
  where preference_id is not null;

create unique index if not exists payments_payment_id_key
  on public.payments (payment_id)
  where payment_id is not null;

create index if not exists payments_order_id_idx on public.payments (order_id);
create index if not exists payments_store_id_idx on public.payments (store_id);
create index if not exists payments_user_id_idx on public.payments (user_id);

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create table if not exists public.payment_events (
  id text primary key,
  payment_id text,
  provider text not null default 'mercado_pago',
  provider_payment_id text,
  event_type text,
  action text,
  processed_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payment_events_payment_id_idx on public.payment_events (payment_id);
create index if not exists payment_events_provider_payment_id_idx on public.payment_events (provider_payment_id);

alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;

grant select on public.order_items to authenticated;
grant select on public.payments to authenticated;
grant select on public.payment_events to authenticated;

drop policy if exists "users read own order items" on public.order_items;
create policy "users read own order items"
on public.order_items for select
using (
  exists (
    select 1
    from public.orders orders
    where orders.id::text = order_items.order_id
      and orders."userId"::text = auth.uid()::text
  )
);

drop policy if exists "admins read store order items" on public.order_items;
create policy "admins read store order items"
on public.order_items for select
using (
  public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor'])
  and public.has_store_access(store_id)
);

drop policy if exists "users read own payments" on public.payments;
create policy "users read own payments"
on public.payments for select
using (user_id = auth.uid());

drop policy if exists "admins read store payments" on public.payments;
create policy "admins read store payments"
on public.payments for select
using (
  public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor'])
  and public.has_store_access(store_id)
);

drop policy if exists "admins read payment events" on public.payment_events;
create policy "admins read payment events"
on public.payment_events for select
using (
  public.has_admin_role(array['gerente', 'gerente_regional'])
);
