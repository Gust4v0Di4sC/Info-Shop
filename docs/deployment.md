# Deploy e Operação

## Netlify

Configuração em `netlify.toml`:

```toml
[build]
  command = "npm run build:observability"
  publish = "dist/info-shop-angular/browser"
  functions = "netlify/functions"
```

Node configurado:

```text
24
```

Redirect importante:

```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200
  force = true
```

## Build

Build de produção:

```bash
npm run build
```

Build SSR local, usando o Express BFF de `src/server.local.ts`:

```bash
npm run build:ssr:local
```

Build com observabilidade:

```bash
npm run build:observability
```

O script de observabilidade envia sourcemaps ao Sentry e remove `.map` do artefato publicado, salvo quando `KEEP_SOURCEMAPS=true`. Para validações locais/CI que não devem publicar sourcemaps, use `SKIP_SENTRY_SOURCEMAPS=true`.

## Environments Angular

`set.env` gera:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

Fontes de configuração:

- `.env.development.local` para desenvolvimento local;
- `.env.production.local` para checks locais production-like;
- variaveis de ambiente do processo, incluindo Netlify;
- `.env.local` como fallback compartilhado.

Variaveis especificas por ambiente podem ser usadas para evitar mistura entre local e producao:

- `DEV_SUPABASE_URL`, `DEV_SUPABASE_ANON_KEY`;
- `LOCAL_SUPABASE_URL`, `LOCAL_SUPABASE_ANON_KEY`;
- `PROD_SUPABASE_URL`, `PROD_SUPABASE_ANON_KEY`.

Variáveis públicas:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` ou `SUPABASE_KEY`
- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT`
- `SENTRY_RELEASE`
- amostragens Sentry.

## Segredos de Runtime

Devem ficar em ambientes de servidor ou Edge Functions:

- `SUPABASE_SERVICE_ROLE_KEY`
- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET`
- `ME_CLIENT_ID`
- `ME_CLIENT_SECRET`
- `GEMINI_API_KEY`
- `BREVO_API_KEY`
- tokens Sentry de upload.

## Supabase

Comandos locais:

```bash
npm run supabase:start
npm run supabase:status
npm run supabase:db:reset
npm run supabase:stop
```

Regeneração de tipos:

```bash
npm run supabase:types:local
npm run supabase:types:linked
```

## Desenvolvimento Local

Comandos recomendados:

```bash
npm run dev          # Angular dev server com SSR local e Express BFF
npm run dev:netlify  # Netlify Dev com redirects/functions
npm run start:ssr    # bundle production-like servido pelo Express local
```

`npm run dev` usa o target `serve:local`, que combina `development,local` no Angular e evita o handler Netlify-only de `src/server.ts`.

## CI

A workflow `.github/workflows/netlify-ci.yml` roda em pull requests e pushes para `main`:

1. `npm ci`
2. `npm run typecheck:netlify`
3. `npm run build:ssr:local`
4. `npm run ci:smoke:local`
5. `npm run build`
6. valida secrets `NETLIFY_SITE_ID` e `NETLIFY_AUTH_TOKEN`
7. `npm run netlify:build` com `SKIP_SENTRY_SOURCEMAPS=true`
8. E2E publico quando `SUPABASE_URL` e `SUPABASE_ANON_KEY` estiverem configuradas como secrets.

Secrets exigidos para o build Netlify no GitHub Actions:

- `NETLIFY_SITE_ID`: ID do site Netlify usado pelo CLI em checkouts limpos.
- `NETLIFY_AUTH_TOKEN`: personal access token do Netlify para carregar contexto do site durante o build.

## Operação

Checklist antes de publicar:

1. Variáveis públicas configuradas no build.
2. Secrets configurados nas Edge Functions.
3. Migrations aplicadas.
4. RLS habilitado.
5. Redirect `/api/*` ativo.
6. Sentry DSN e release configurados.
7. `npm run build:observability` concluído.
