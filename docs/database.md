# Banco de Dados e Supabase

## Migrations

As migrations ficam em `supabase/migrations` e devem ser aplicadas em ordem cronológica.

Principais marcos:

- `20260801020656_customer_shopping_schema.sql`: schema inicial de produtos, clientes, usuários, admins, pedidos e carrinho.
- `20260802234000_admin_operations.sql`: estoque, total de pedido e entregas.
- `20260803093000_admin_roles.sql`: papéis administrativos e políticas por função.
- `20260804110000_admin_personalization.sql`: tema/logo e bucket de branding.
- `20260806100000_admin_store_tenants.sql`: lojas, acessos e isolamento por `store_id`.
- `20260808100000_melhor_envio_shipping.sql`: campos e tokens Melhor Envio.
- `20260809170000_mercado_pago_payments.sql`: order items, payments e payment events.
- `20260811110000_seed_category_catalog_products.sql`: categorias e produtos seed.
- `20260811120000_newsletter_subscribers.sql`: newsletter.
- `20260811130000_customer_avatar_storage.sql`: avatars de cliente.
- `20260814100000_security_hardening.sql`: reforço de RLS e políticas.
- `20260814143000_performance_indexes.sql`: índices de catálogo, busca e carrinho.
- `20260815100000_observability_pg_stat_statements.sql`: suporte a observabilidade SQL.

## Tabelas Principais

- `products`: catálogo, preço, estoque, categoria, destaque, oferta e dimensões de pacote.
- `clients`: cadastro operacional de clientes por loja.
- `users`: perfil público vinculado ao Auth.
- `admins`: perfil administrativo, papel, região, tema e logo.
- `stores`: lojas/tenants e dados de remetente.
- `admin_store_accesses`: vínculo admin-loja.
- `orders`: pedido resumido usado pelo admin e checkout.
- `order_items`: itens normalizados do pedido.
- `cart_items`: carrinho do cliente.
- `deliveries`: entregas e rastreio.
- `payments`: pagamentos Mercado Pago.
- `payment_events`: eventos/webhooks de pagamento.
- `melhor_envio_tokens`: tokens de integração de frete.
- `newsletter_subscribers`: inscrições da newsletter.
- `edge_rate_limits`: controle de limite de Edge Functions.

## Storage

Buckets documentados nas migrations:

- `admin-branding`: logos e assets de personalização administrativa.
- `customer-avatars`: avatars públicos de clientes.

## RLS

O schema habilita Row Level Security nas tabelas sensíveis.

Diretrizes do modelo:

- Produtos são visíveis publicamente.
- Clientes acessam seus próprios perfis, carrinhos, pedidos, pagamentos e entregas.
- Admins acessam dados das lojas vinculadas.
- Operações administrativas são filtradas por papel e por `store_id`.
- Buckets públicos permitem leitura, mas escrita é restrita ao proprietário ou administrador autorizado.

## Tipos TypeScript

`src/app/core/supabase/database.types.ts` é o contrato tipado gerado pelo Supabase. Os modelos em `src/app/models` derivam desse arquivo por `Tables`, `TablesInsert` e `TablesUpdate`.

Comandos úteis:

```bash
npm run supabase:types:local
npm run supabase:types:linked
```
