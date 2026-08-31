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
22.22.0
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

Build com observabilidade:

```bash
npm run build:observability
```

O script de observabilidade envia sourcemaps ao Sentry e remove `.map` do artefato publicado, salvo quando `KEEP_SOURCEMAPS=true`.

## Environments Angular

`set.env` gera:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

Fontes de configuração:

- variáveis de ambiente do processo;
- `.env.local`;
- fallbacks definidos no script.

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

## Operação

Checklist antes de publicar:

1. Variáveis públicas configuradas no build.
2. Secrets configurados nas Edge Functions.
3. Migrations aplicadas.
4. RLS habilitado.
5. Redirect `/api/*` ativo.
6. Sentry DSN e release configurados.
7. `npm run build:observability` concluído.
