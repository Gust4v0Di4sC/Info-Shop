# Testes

## Testes Unitários

O projeto usa Karma/Jasmine pela configuração padrão do Angular.

Comando:

```bash
npm run test
```

Arquivos `*.spec.ts` cobrem serviços, pipes, componentes e guards selecionados.

## E2E com Playwright

Os testes E2E ficam em `e2e`.

Comando:

```bash
npm run e2e
```

O `playwright.config.ts` sobe o app via:

```bash
npm run start:ssr:dev
```

Base URL padrão:

```text
http://127.0.0.1:4000
```

## Mocks

`e2e/helpers.ts` possui helpers para:

- usuário deslogado;
- sessão administrativa por papel;
- respostas mockadas de `/api/auth/session`;
- respostas mockadas de `/api/supabase/**`;
- validação de path atual.

Isso permite testar fluxo público, autenticação e permissões sem depender do Supabase real.

## Cobertura E2E Atual

- Navegação pública por landing, âncoras, catálogo, categoria e busca.
- Produto, quantidade e bloqueio de carrinho sem login.
- Carrinho sem login.
- Login com validações e credenciais inválidas.
- Cadastro com validações e confirmação mockada.
- Recuperação de senha.
- Callback de auth com erro.
- Bloqueio de rotas admin para visitante.
- Rotas padrão por papel administrativo.
- Menu administrativo e logout.
- Menu mobile.

## Validação Real

`e2e/live.spec.ts` só roda quando:

```bash
E2E_LIVE=true
```

Credenciais opcionais:

- `E2E_MANAGER_EMAIL`
- `E2E_MANAGER_PASSWORD`
- `E2E_SELLER_EMAIL`
- `E2E_SELLER_PASSWORD`
- `E2E_STOCK_EMAIL`
- `E2E_STOCK_PASSWORD`
- `E2E_NEW_CLIENT_EMAIL`
- `E2E_NEW_CLIENT_PASSWORD`

Esse fluxo acessa Supabase real, valida permissões, perfil de cliente, carrinho, IA, frete e pagamento.
