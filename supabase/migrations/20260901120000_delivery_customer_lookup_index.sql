create index if not exists deliveries_user_created_idx
on public.deliveries (user_id, created_at desc)
include (
  id,
  order_id,
  store_id,
  status,
  address,
  carrier,
  tracking_code,
  estimated_delivery_date,
  melhor_envio_protocol,
  selected_service_name,
  shipping_price,
  shipping_deadline,
  tracking_url,
  label_status
);
