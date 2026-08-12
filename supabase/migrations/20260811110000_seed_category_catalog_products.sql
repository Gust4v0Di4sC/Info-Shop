alter table public.products
  add column if not exists category text not null default 'hardware';

create index if not exists products_category_idx on public.products (category);
create index if not exists products_store_category_idx on public.products (store_id, category);

insert into public.products (
  store_id,
  category,
  name,
  model,
  price,
  cost,
  description,
  "imageUrl",
  stock_quantity,
  stock_minimum,
  is_featured,
  is_offer,
  offer_price,
  offer_badge,
  offer_ends_at,
  offer_sold_percent,
  shipping_weight,
  shipping_width,
  shipping_height,
  shipping_length,
  shipping_insurance_value
)
select
  seed.store_id,
  seed.category,
  seed.name,
  seed.model,
  seed.price,
  seed.cost,
  seed.description,
  seed.image_url,
  seed.stock_quantity,
  seed.stock_minimum,
  seed.is_featured,
  seed.is_offer,
  seed.offer_price,
  seed.offer_badge,
  seed.offer_ends_at,
  seed.offer_sold_percent,
  seed.shipping_weight,
  seed.shipping_width,
  seed.shipping_height,
  seed.shipping_length,
  seed.shipping_insurance_value
from (
  values
    ('00000000-0000-0000-0000-000000000201', 'notebooks', 'Notebook NovaBook Pro 14', 'NBP-14-I5-16', 4299.90, 3290.00, 'Notebook leve com Intel Core i5, 16GB de RAM e SSD de 512GB.', '/product1.png', 18, 4, true, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 1.60, 32.00, 2.00, 22.00, 4299.90),
    ('00000000-0000-0000-0000-000000000201', 'notebooks', 'Notebook NovaBook Studio 16', 'NBS-16-I7-32', 7899.90, 6150.00, 'Notebook para criadores com Core i7, 32GB de RAM e tela de 16 polegadas.', '/product2.png', 11, 3, true, true, 7199.90, 'Semana do notebook', now() + interval '7 days', 42, 2.10, 36.00, 3.00, 25.00, 7899.90),
    ('00000000-0000-0000-0000-000000000201', 'notebooks', 'Notebook WorkLine Ryzen 5', 'WL-R5-8-256', 3199.90, 2410.00, 'Notebook para produtividade com Ryzen 5, 8GB de RAM e SSD NVMe.', '/product3.png', 24, 5, false, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 1.80, 34.00, 3.00, 24.00, 3199.90),
    ('00000000-0000-0000-0000-000000000201', 'notebooks', 'Notebook Gamer Striker 15', 'STK-15-I7-RTX', 8999.90, 7050.00, 'Notebook gamer com GPU dedicada, tela 144Hz e resfriamento reforcado.', '/product4.png', 9, 2, true, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 2.40, 38.00, 4.00, 28.00, 8999.90),
    ('00000000-0000-0000-0000-000000000201', 'notebooks', 'Notebook Essential 15', 'ESS-15-I3-8', 2399.90, 1780.00, 'Notebook de entrada para estudos, reunioes e navegacao diaria.', '/product1.png', 30, 6, false, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 1.90, 36.00, 3.00, 25.00, 2399.90),

    ('00000000-0000-0000-0000-000000000201', 'smartphones', 'Smartphone Orion X1 128GB', 'OR-X1-128', 1899.90, 1320.00, 'Smartphone 5G com tela AMOLED, 128GB e camera principal de 50MP.', '/product2.png', 35, 8, true, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 0.45, 10.00, 6.00, 18.00, 1899.90),
    ('00000000-0000-0000-0000-000000000201', 'smartphones', 'Smartphone Orion X1 256GB', 'OR-X1-256', 2299.90, 1640.00, 'Versao com mais armazenamento para fotos, videos e apps pesados.', '/product3.png', 28, 7, false, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 0.46, 10.00, 6.00, 18.00, 2299.90),
    ('00000000-0000-0000-0000-000000000201', 'smartphones', 'Smartphone PixelWay A7', 'PW-A7-128', 1599.90, 1120.00, 'Celular equilibrado com bateria de longa duracao e carregamento rapido.', '/product4.png', 42, 9, false, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 0.44, 10.00, 6.00, 18.00, 1599.90),
    ('00000000-0000-0000-0000-000000000201', 'smartphones', 'Smartphone MaxView Ultra', 'MVU-512', 4999.90, 3810.00, 'Smartphone premium com 512GB, camera avancada e tela de alto brilho.', '/product1.png', 14, 4, true, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 0.48, 10.00, 6.00, 18.00, 4999.90),
    ('00000000-0000-0000-0000-000000000201', 'smartphones', 'Smartphone Compact Neo', 'CPN-64', 999.90, 710.00, 'Modelo compacto para tarefas essenciais, redes sociais e chamadas.', '/product2.png', 50, 10, false, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 0.42, 10.00, 6.00, 18.00, 999.90),

    ('00000000-0000-0000-0000-000000000201', 'tablets', 'Tablet TabOne 10 128GB', 'T1-10-128', 1699.90, 1190.00, 'Tablet de 10 polegadas para estudos, streaming e anotacoes.', '/product3.png', 26, 6, true, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 0.70, 24.00, 5.00, 17.00, 1699.90),
    ('00000000-0000-0000-0000-000000000201', 'tablets', 'Tablet TabOne Kids', 'T1-KIDS-64', 899.90, 620.00, 'Tablet infantil com capa reforcada e controle parental.', '/product4.png', 31, 7, false, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 0.78, 24.00, 6.00, 18.00, 899.90),
    ('00000000-0000-0000-0000-000000000201', 'tablets', 'Tablet ProDraw 12', 'PD-12-256', 3299.90, 2460.00, 'Tablet para desenho, produtividade e multitarefa com caneta ativa.', '/product1.png', 13, 3, true, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 0.86, 30.00, 5.00, 22.00, 3299.90),
    ('00000000-0000-0000-0000-000000000201', 'tablets', 'Tablet ViewPad LTE', 'VP-LTE-128', 1999.90, 1410.00, 'Tablet com conexao LTE para trabalho e entretenimento fora de casa.', '/product2.png', 20, 5, false, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 0.74, 25.00, 5.00, 18.00, 1999.90),
    ('00000000-0000-0000-0000-000000000201', 'tablets', 'Tablet MiniNote 8', 'MN-8-64', 1199.90, 830.00, 'Tablet compacto para leitura, videochamadas e uso diario.', '/product3.png', 37, 8, false, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 0.58, 22.00, 5.00, 15.00, 1199.90),

    ('00000000-0000-0000-0000-000000000201', 'games', 'Console GameBox Series S', 'GB-S-512', 2799.90, 2100.00, 'Console compacto com SSD rapido e biblioteca digital.', '/product4.png', 16, 4, true, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 2.80, 30.00, 12.00, 30.00, 2799.90),
    ('00000000-0000-0000-0000-000000000201', 'games', 'Console GameBox Series X', 'GB-X-1TB', 4499.90, 3440.00, 'Console de alto desempenho para jogos em 4K.', '/product1.png', 10, 3, true, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 4.20, 34.00, 16.00, 34.00, 4499.90),
    ('00000000-0000-0000-0000-000000000201', 'games', 'Controle Wireless Storm', 'CTRL-ST-WL', 399.90, 250.00, 'Controle sem fio com resposta rapida e bateria recarregavel.', '/product2.png', 48, 10, false, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 0.55, 18.00, 8.00, 18.00, 399.90),
    ('00000000-0000-0000-0000-000000000201', 'games', 'Headset Gamer Pulse 7.1', 'HGP-71', 349.90, 220.00, 'Headset gamer com audio virtual 7.1 e microfone removivel.', '/product3.png', 44, 9, false, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 0.80, 22.00, 12.00, 24.00, 349.90),
    ('00000000-0000-0000-0000-000000000201', 'games', 'Cadeira Gamer ErgoPlay', 'EP-CHAIR-BK', 1299.90, 870.00, 'Cadeira gamer ergonomica com ajuste de altura e apoio lombar.', '/product4.png', 12, 3, false, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 18.00, 70.00, 34.00, 86.00, 1299.90),

    ('00000000-0000-0000-0000-000000000201', 'hardware', 'Processador Ryzen 7 8700X', 'R7-8700X', 2199.90, 1620.00, 'Processador de alto desempenho para games e produtividade.', '/product1.png', 22, 5, true, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 0.40, 14.00, 7.00, 14.00, 2199.90),
    ('00000000-0000-0000-0000-000000000201', 'hardware', 'Placa Mae Prime B650', 'PM-B650', 1199.90, 820.00, 'Placa mae AM5 com suporte a DDR5 e armazenamento NVMe.', '/product2.png', 19, 4, false, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 1.10, 28.00, 8.00, 28.00, 1199.90),
    ('00000000-0000-0000-0000-000000000201', 'hardware', 'Memoria DDR5 32GB 6000MHz', 'DDR5-32-6000', 899.90, 590.00, 'Kit de memoria DDR5 para setups modernos de alto desempenho.', '/product3.png', 34, 8, false, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 0.30, 16.00, 4.00, 12.00, 899.90),
    ('00000000-0000-0000-0000-000000000201', 'hardware', 'SSD NVMe 1TB Turbo', 'SSD-NVME-1TB', 549.90, 350.00, 'SSD NVMe de 1TB para carregamentos rapidos e alta taxa de leitura.', '/product4.png', 52, 10, false, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 0.25, 12.00, 3.00, 10.00, 549.90),
    ('00000000-0000-0000-0000-000000000201', 'hardware', 'Fonte 750W Gold Modular', 'PSU-750-G', 699.90, 460.00, 'Fonte modular 80 Plus Gold para computadores gamer e workstations.', '/product1.png', 27, 6, false, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 2.20, 24.00, 12.00, 20.00, 699.90),

    ('00000000-0000-0000-0000-000000000201', 'perifericos', 'Mouse Precision Pro', 'MSE-PP-16K', 249.90, 150.00, 'Mouse ergonomico com sensor de 16000 DPI e botoes programaveis.', '/product2.png', 60, 12, true, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 0.35, 14.00, 8.00, 20.00, 249.90),
    ('00000000-0000-0000-0000-000000000201', 'perifericos', 'Teclado Mecanico Alloy RGB', 'KEY-AL-RGB', 399.90, 250.00, 'Teclado mecanico ABNT2 com iluminacao RGB e switches tateis.', '/product3.png', 38, 8, false, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 1.00, 46.00, 6.00, 18.00, 399.90),
    ('00000000-0000-0000-0000-000000000201', 'perifericos', 'Monitor Vision 24 144Hz', 'MON-24-144', 1099.90, 760.00, 'Monitor Full HD de 24 polegadas com taxa de atualizacao de 144Hz.', '/product4.png', 21, 5, true, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 4.80, 60.00, 14.00, 42.00, 1099.90),
    ('00000000-0000-0000-0000-000000000201', 'perifericos', 'Webcam StreamCam 1080p', 'CAM-1080', 299.90, 180.00, 'Webcam Full HD com microfone integrado para reunioes e lives.', '/product1.png', 46, 9, false, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 0.45, 14.00, 8.00, 14.00, 299.90),
    ('00000000-0000-0000-0000-000000000201', 'perifericos', 'Hub USB-C Dock 8 em 1', 'DOCK-USBC-8', 349.90, 210.00, 'Dock USB-C com HDMI, rede, leitor de cartao e portas USB extras.', '/product2.png', 40, 8, false, false, null::numeric, 'Oferta por tempo limitado', null::timestamptz, 0, 0.50, 16.00, 5.00, 12.00, 349.90)
) as seed(
  store_id,
  category,
  name,
  model,
  price,
  cost,
  description,
  image_url,
  stock_quantity,
  stock_minimum,
  is_featured,
  is_offer,
  offer_price,
  offer_badge,
  offer_ends_at,
  offer_sold_percent,
  shipping_weight,
  shipping_width,
  shipping_height,
  shipping_length,
  shipping_insurance_value
)
where not exists (
  select 1
  from public.products products
  where products.store_id = seed.store_id
    and products.name = seed.name
);
