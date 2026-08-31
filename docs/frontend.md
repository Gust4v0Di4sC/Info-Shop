# Frontend Angular

## Organização

O projeto usa Angular 20 com componentes standalone e lazy loading em `app.routes.ts`.

- `features/public`: experiência da loja e cliente.
- `features/auth`: autenticação e recuperação de acesso.
- `features/admin`: painel administrativo.
- `core`: serviços transversais.
- `shared`: Material module, pipes, diretivas, dialogs e utilitários.
- `models`: tipos de domínio baseados em `Database` do Supabase.
- `services`: serviços de aplicação.

## Rotas Principais

Rotas públicas:

- `/`: landing page.
- `/catalogo` e `/catalogo/:category`: catálogo.
- `/produto/:id`: detalhe de produto.
- `/suporte/:topic`: páginas de suporte.
- `/carrinho`: carrinho.
- `/perfil`: perfil do cliente autenticado.
- `/minhas-entregas`: entregas do cliente.
- `/pagamento/retorno`: retorno de checkout.

Rotas de autenticação:

- `/home`: login.
- `/registro`: cadastro.
- `/recuperar-senha`: solicitação de reset.
- `/nova-senha`: troca de senha.
- `/auth/callback`: callback Supabase/OAuth.

Rotas administrativas:

- `/dash`: dashboard.
- `/products`: produtos.
- `/orders`: pedidos.
- `/stock`: estoque.
- `/deliveries`: entregas.
- `/offers`: ofertas.
- `/clients`: clientes.
- `/customization`: personalização.
- `/admin-profile`: perfil administrativo.

## Estado e Serviços

- `AuthService`: sessão atual, login, cadastro, OAuth, callback, logout e redirecionamento pós-login.
- `ProductService`: catálogo público via BFF e operações administrativas por loja.
- `CartServiceService`: carrinho por usuário, contagem, alterações de quantidade e cotação de frete.
- `PaymentService`: cria preferência de pagamento por Edge Function.
- `DeliveryService`: entregas administrativas e entregas do cliente.
- `OrderService`: pedidos administrativos filtrados por loja.
- `AdminDashboardService`: métricas gerenciais e dados para gráficos.
- `TenantContextService`: lista lojas permitidas e persiste a loja selecionada no `localStorage`.
- `AdminThemeService`: tema, logo e upload para bucket `admin-branding`.

## UI

- Angular Material/CDK fornece shell administrativo, sidenav, menus, botões, formulários e dialogs.
- `ng2-charts` e Chart.js renderizam gráficos do dashboard.
- SCSS é usado globalmente e por componente.
- Diretivas GSAP em `shared/directives` aplicam movimento de página e interações.
- `NgOptimizedImage` e `IMAGE_LOADER` customizado tratam imagens locais e do Supabase.

## PWA

`ngsw-config.json` habilita Service Worker em produção fora de localhost.

- Assets do app são pré-carregados.
- Imagens e assets públicos usam cache lazy.
- `/api/public/products` usa estratégia `freshness` com cache curto para catálogo público.
