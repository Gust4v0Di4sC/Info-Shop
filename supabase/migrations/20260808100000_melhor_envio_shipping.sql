alter table public.products
  add column if not exists shipping_weight numeric(10, 3),
  add column if not exists shipping_width numeric(10, 2),
  add column if not exists shipping_height numeric(10, 2),
  add column if not exists shipping_length numeric(10, 2),
  add column if not exists shipping_insurance_value numeric(12, 2);

alter table public.stores
  add column if not exists sender_document text,
  add column if not exists sender_email text,
  add column if not exists sender_phone text,
  add column if not exists sender_postal_code text,
  add column if not exists sender_address text,
  add column if not exists sender_number text,
  add column if not exists sender_complement text,
  add column if not exists sender_district text,
  add column if not exists sender_city text,
  add column if not exists sender_state text,
  add column if not exists default_package_weight numeric(10, 3) not null default 0.5,
  add column if not exists default_package_width numeric(10, 2) not null default 16,
  add column if not exists default_package_height numeric(10, 2) not null default 4,
  add column if not exists default_package_length numeric(10, 2) not null default 24;

alter table public.deliveries
  add column if not exists melhor_envio_order_id text,
  add column if not exists melhor_envio_protocol text,
  add column if not exists selected_service_id text,
  add column if not exists selected_service_name text,
  add column if not exists shipping_price numeric(12, 2),
  add column if not exists shipping_deadline integer,
  add column if not exists tracking_url text,
  add column if not exists label_status text,
  add column if not exists webhook_payload jsonb;

create index if not exists deliveries_melhor_envio_order_id_idx
  on public.deliveries (melhor_envio_order_id);

create table if not exists public.melhor_envio_tokens (
  id text primary key default 'default',
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  refresh_expires_at timestamptz,
  scopes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists melhor_envio_tokens_set_updated_at on public.melhor_envio_tokens;
create trigger melhor_envio_tokens_set_updated_at
before update on public.melhor_envio_tokens
for each row execute function public.set_updated_at();

alter table public.melhor_envio_tokens enable row level security;

create or replace function public.update_store_shipping(
  store_id_value text,
  sender_document_value text,
  sender_email_value text,
  sender_phone_value text,
  sender_postal_code_value text,
  sender_address_value text,
  sender_number_value text,
  sender_complement_value text,
  sender_district_value text,
  sender_city_value text,
  sender_state_value text,
  default_package_weight_value numeric,
  default_package_width_value numeric,
  default_package_height_value numeric,
  default_package_length_value numeric
)
returns public.stores
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_store public.stores;
begin
  if not public.has_admin_role(array['gerente', 'gerente_regional', 'vendedor', 'estoquista']) then
    raise exception 'Acesso negado para atualizar dados de envio.' using errcode = '42501';
  end if;

  if not public.has_store_access(store_id_value) then
    raise exception 'Acesso negado para esta loja.' using errcode = '42501';
  end if;

  update public.stores
  set
    sender_document = nullif(btrim(sender_document_value), ''),
    sender_email = nullif(btrim(sender_email_value), ''),
    sender_phone = nullif(btrim(sender_phone_value), ''),
    sender_postal_code = nullif(btrim(sender_postal_code_value), ''),
    sender_address = nullif(btrim(sender_address_value), ''),
    sender_number = nullif(btrim(sender_number_value), ''),
    sender_complement = nullif(btrim(sender_complement_value), ''),
    sender_district = nullif(btrim(sender_district_value), ''),
    sender_city = nullif(btrim(sender_city_value), ''),
    sender_state = nullif(upper(btrim(sender_state_value)), ''),
    default_package_weight = greatest(coalesce(default_package_weight_value, 0.5), 0.001),
    default_package_width = greatest(coalesce(default_package_width_value, 16), 1),
    default_package_height = greatest(coalesce(default_package_height_value, 4), 1),
    default_package_length = greatest(coalesce(default_package_length_value, 24), 1)
  where id = store_id_value
  returning * into updated_store;

  if updated_store.id is null then
    raise exception 'Loja nao encontrada.' using errcode = 'P0002';
  end if;

  return updated_store;
end;
$$;

grant execute on function public.update_store_shipping(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  numeric,
  numeric
) to authenticated;
