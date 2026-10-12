create or replace function public.add_product_to_cart(
  product_id_value text,
  quantity_value integer default 1
)
returns integer
language plpgsql
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_product_id text := btrim(coalesce(product_id_value, ''));
  normalized_quantity integer := greatest(coalesce(quantity_value, 1), 1);
  cart_total integer;
begin
  if current_user_id is null then
    raise exception 'Entre na sua conta para usar o carrinho.' using errcode = '42501';
  end if;

  if normalized_product_id = '' or not exists (
    select 1
    from public.products
    where id::text = normalized_product_id
  ) then
    raise exception 'Produto não encontrado para adicionar ao carrinho.' using errcode = 'P0002';
  end if;

  insert into public.cart_items (user_id, product_id, quantity)
  values (current_user_id, normalized_product_id, normalized_quantity)
  on conflict (user_id, product_id) do update
    set quantity = public.cart_items.quantity + excluded.quantity;

  select coalesce(sum(quantity), 0)::integer
  into cart_total
  from public.cart_items
  where user_id = current_user_id;

  return cart_total;
end;
$$;

revoke all on function public.add_product_to_cart(text, integer) from public, anon;
grant execute on function public.add_product_to_cart(text, integer) to authenticated;
