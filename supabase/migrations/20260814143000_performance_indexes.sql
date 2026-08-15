create extension if not exists pg_trgm;

create index if not exists products_public_catalog_idx
on public.products (category, is_featured desc, created_at desc)
include (id, name, model, price, offer_price, "imageUrl");

create index if not exists products_public_featured_idx
on public.products (is_featured desc, created_at desc)
include (id, name, model, price, offer_price, "imageUrl");

create index if not exists products_public_offer_idx
on public.products (is_offer, updated_at desc)
where is_offer = true;

create index if not exists products_name_trgm_idx
on public.products using gin (name gin_trgm_ops);

create index if not exists products_model_trgm_idx
on public.products using gin (model gin_trgm_ops);

create index if not exists products_description_trgm_idx
on public.products using gin (description gin_trgm_ops);

create index if not exists cart_items_user_created_idx
on public.cart_items (user_id, created_at);

create index if not exists cart_items_user_product_idx
on public.cart_items (user_id, product_id);
