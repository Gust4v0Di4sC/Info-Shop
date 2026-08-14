create table if not exists public.edge_rate_limits (
  scope text not null,
  subject_hash text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (scope, subject_hash, window_start)
);

alter table public.edge_rate_limits enable row level security;

drop trigger if exists edge_rate_limits_set_updated_at on public.edge_rate_limits;
create trigger edge_rate_limits_set_updated_at
before update on public.edge_rate_limits
for each row execute function public.set_updated_at();

revoke all on public.edge_rate_limits from anon, authenticated;

create or replace function public.check_edge_rate_limit(
  scope_value text,
  subject_hash_value text,
  max_requests_value integer,
  window_seconds_value integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_scope text;
  normalized_subject_hash text;
  window_size integer;
  window_start_value timestamptz;
  current_count integer;
begin
  normalized_scope := lower(btrim(coalesce(scope_value, '')));
  normalized_subject_hash := lower(btrim(coalesce(subject_hash_value, '')));
  window_size := greatest(coalesce(window_seconds_value, 60), 1);

  if normalized_scope = '' or normalized_subject_hash = '' then
    raise exception 'Rate limit invalido.' using errcode = '22023';
  end if;

  if max_requests_value is null or max_requests_value < 1 then
    raise exception 'Limite invalido.' using errcode = '22023';
  end if;

  window_start_value := to_timestamp(floor(extract(epoch from now()) / window_size) * window_size);

  insert into public.edge_rate_limits (scope, subject_hash, window_start, request_count)
  values (normalized_scope, normalized_subject_hash, window_start_value, 1)
  on conflict (scope, subject_hash, window_start) do update
    set request_count = public.edge_rate_limits.request_count + 1
  returning request_count into current_count;

  delete from public.edge_rate_limits
  where window_start < now() - interval '1 day';

  return current_count <= max_requests_value;
end;
$$;

revoke all on function public.check_edge_rate_limit(text, text, integer, integer) from public;
grant execute on function public.check_edge_rate_limit(text, text, integer, integer) to service_role;

alter table public.products enable row level security;
alter table public.clients enable row level security;
alter table public.users enable row level security;
alter table public.admins enable row level security;
alter table public.orders enable row level security;
alter table public.cart_items enable row level security;
alter table public.deliveries enable row level security;
alter table public.stores enable row level security;
alter table public.admin_store_accesses enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.melhor_envio_tokens enable row level security;

revoke all on public.melhor_envio_tokens from anon, authenticated;
revoke insert, update, delete on public.order_items from anon, authenticated;
revoke insert, update, delete on public.payments from anon, authenticated;
revoke insert, update, delete on public.payment_events from anon, authenticated;

drop policy if exists "products are visible to everyone" on public.products;
create policy "products are visible to everyone"
on public.products for select
to anon, authenticated
using (true);

drop policy if exists "admins manage products" on public.products;
drop policy if exists "admins insert products" on public.products;
create policy "admins insert products"
on public.products for insert
to authenticated
with check (
  public.has_admin_role(array['gerente', 'gerente_regional', 'estoquista'])
  and public.has_store_access(store_id)
);

drop policy if exists "admins update products" on public.products;
create policy "admins update products"
on public.products for update
to authenticated
using (
  public.has_admin_role(array['gerente', 'gerente_regional', 'estoquista'])
  and public.has_store_access(store_id)
)
with check (
  public.has_admin_role(array['gerente', 'gerente_regional', 'estoquista'])
  and public.has_store_access(store_id)
);

drop policy if exists "admins delete products" on public.products;
create policy "admins delete products"
on public.products for delete
to authenticated
using (
  public.has_admin_role(array['gerente', 'gerente_regional', 'estoquista'])
  and public.has_store_access(store_id)
);

drop policy if exists "users manage own profile" on public.users;
drop policy if exists "users read own profile" on public.users;
create policy "users read own profile"
on public.users for select
to authenticated
using (id = auth.uid());

drop policy if exists "users insert own profile" on public.users;
create policy "users insert own profile"
on public.users for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "users update own profile" on public.users;
create policy "users update own profile"
on public.users for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "admins read profiles" on public.users;
create policy "admins read profiles"
on public.users for select
to authenticated
using (public.has_admin_role(array['gerente', 'gerente_regional']));

drop policy if exists "users read own admin status" on public.admins;
create policy "users read own admin status"
on public.admins for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_admin_role(array['gerente', 'gerente_regional'])
);

drop policy if exists "users manage own cart" on public.cart_items;
drop policy if exists "users read own cart" on public.cart_items;
create policy "users read own cart"
on public.cart_items for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "users insert own cart" on public.cart_items;
create policy "users insert own cart"
on public.cart_items for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "users update own cart" on public.cart_items;
create policy "users update own cart"
on public.cart_items for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users delete own cart" on public.cart_items;
create policy "users delete own cart"
on public.cart_items for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "admins read cart items" on public.cart_items;
create policy "admins read cart items"
on public.cart_items for select
to authenticated
using (public.has_admin_role(array['gerente', 'gerente_regional']));

drop policy if exists "users read own orders" on public.orders;
create policy "users read own orders"
on public.orders for select
to authenticated
using ("userId"::text = auth.uid()::text);

drop policy if exists "admins manage orders" on public.orders;
create policy "admins manage orders"
on public.orders for all
to authenticated
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
to authenticated
using (
  public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor'])
  and public.has_store_access(store_id)
)
with check (
  public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor'])
  and public.has_store_access(store_id)
);

drop policy if exists "admins read stores" on public.stores;
create policy "admins read stores"
on public.stores for select
to authenticated
using (public.has_store_access(id));

drop policy if exists "admins read store accesses" on public.admin_store_accesses;
create policy "admins read store accesses"
on public.admin_store_accesses for select
to authenticated
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

drop policy if exists "users read own deliveries" on public.deliveries;
create policy "users read own deliveries"
on public.deliveries for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "admins manage deliveries" on public.deliveries;
create policy "admins manage deliveries"
on public.deliveries for all
to authenticated
using (
  public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor'])
  and public.has_store_access(store_id)
)
with check (
  public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor'])
  and public.has_store_access(store_id)
);

drop policy if exists "users read own order items" on public.order_items;
create policy "users read own order items"
on public.order_items for select
to authenticated
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
to authenticated
using (
  public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor'])
  and public.has_store_access(store_id)
);

drop policy if exists "users read own payments" on public.payments;
create policy "users read own payments"
on public.payments for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "admins read store payments" on public.payments;
create policy "admins read store payments"
on public.payments for select
to authenticated
using (
  public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor'])
  and public.has_store_access(store_id)
);

drop policy if exists "admins read payment events" on public.payment_events;
create policy "admins read payment events"
on public.payment_events for select
to authenticated
using (public.has_admin_role(array['gerente', 'gerente_regional']));

drop policy if exists "admins read newsletter subscribers" on public.newsletter_subscribers;
create policy "admins read newsletter subscribers"
on public.newsletter_subscribers for select
to authenticated
using (public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor']));

drop policy if exists "public read customer avatars" on storage.objects;
create policy "public read customer avatars"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'customer-avatars');

drop policy if exists "users upload own customer avatars" on storage.objects;
create policy "users upload own customer avatars"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'customer-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users update own customer avatars" on storage.objects;
create policy "users update own customer avatars"
on storage.objects for update
to authenticated
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
to authenticated
using (
  bucket_id = 'customer-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "public read admin branding assets" on storage.objects;
create policy "public read admin branding assets"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'admin-branding');

drop policy if exists "admins upload own branding assets" on storage.objects;
create policy "admins upload own branding assets"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'admin-branding'
  and public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor', 'estoquista'])
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "admins update own branding assets" on storage.objects;
create policy "admins update own branding assets"
on storage.objects for update
to authenticated
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
to authenticated
using (
  bucket_id = 'admin-branding'
  and public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor', 'estoquista'])
  and (storage.foldername(name))[1] = auth.uid()::text
);
