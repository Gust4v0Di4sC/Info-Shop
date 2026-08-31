# Visão Geral

Info-Shop é um e-commerce de produtos de informática com duas experiências principais: loja pública para clientes e painel administrativo para operação interna.

## Atores

- Visitante: navega pela landing page, catálogo, produtos, suporte e login/cadastro.
- Cliente autenticado: usa carrinho, finaliza compra, atualiza perfil, acompanha entregas e usa o comparador de hardware.
- Administrador: acessa área interna conforme perfil operacional.
- Gerente ou gerente regional: acessa dashboard, produtos, pedidos, estoque, entregas, ofertas, clientes, personalização e perfil.
- Vendedor: acessa pedidos, clientes, entregas, ofertas, personalização e perfil.
- Estoquista: acessa estoque, produtos, personalização e perfil.

## Funcionalidades

- Landing page com hero, categorias, produtos em destaque, oferta especial, comparador de hardware e newsletter.
- Catálogo público com filtros por categoria e busca textual.
- Detalhe do produto com preço, oferta, galeria, quantidade, carrinho e comparador de hardware.
- Login de cliente/admin, cadastro, recuperação de senha, callback OAuth/PKCE e nova senha.
- Carrinho persistido no Supabase por usuário.
- Cotação de frete via Melhor Envio.
- Checkout via Mercado Pago.
- Retorno de pagamento e acompanhamento de entregas.
- Dashboard administrativo com métricas de produtos, pedidos, estoque, receita e entregas.
- CRUD operacional de produtos, pedidos, clientes, entregas e ofertas.
- Contexto multi-loja para administradores com acesso a uma ou mais lojas.
- Personalização administrativa de tema e logo.
- Observabilidade com Sentry e logs estruturados nas Edge Functions.

## Capturas

As imagens foram geradas por Playwright no SSR local, usando dados mockados para estabilidade da documentação.

![Landing page](assets/screenshots/landing-page.png)

![Catálogo](assets/screenshots/catalogo.png)

![Login](assets/screenshots/login.png)

![Administração de produtos](assets/screenshots/admin-produtos.png)
