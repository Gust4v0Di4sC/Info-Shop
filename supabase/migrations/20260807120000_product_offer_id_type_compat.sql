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
  where id::text = product_id
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
  where id::text = product_id
    and store_id = store_id_value
  returning * into updated_product;

  if updated_product.id is null then
    raise exception 'Produto nao encontrado nesta loja.' using errcode = 'P0002';
  end if;

  return updated_product;
end;
$$;

grant execute on function public.set_active_offer(text, numeric, text, timestamptz, integer, text) to authenticated;
grant execute on function public.set_product_featured(text, boolean, text) to authenticated;
