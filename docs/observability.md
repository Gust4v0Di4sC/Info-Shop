# Observabilidade

Este projeto usa Sentry para observabilidade do Angular e Supabase Log Explorer para Edge Functions, Auth, Storage e Postgres.

## Sentry

1. Crie um projeto Sentry do tipo JavaScript/Angular.
2. Copie o DSN publico do projeto.
3. Habilite Performance e Session Replay.
4. Crie um auth token com permissao para upload de sourcemaps.
5. Configure alertas:
   - erro novo em producao: notificar imediatamente;
   - taxa de erro acima de 3% em 5 minutos: P1;
   - transacoes acima de 2s em checkout/frete: P2;
   - INP ruim em mobile: acompanhar em dashboard semanal.

Variaveis esperadas no build:

```env
SENTRY_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=
SENTRY_TRACES_SAMPLE_RATE=0.2
SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.05
SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

`SENTRY_DSN`, amostragens, ambiente e release entram no bundle Angular e devem ser valores publicos. `SENTRY_AUTH_TOKEN` fica apenas no ambiente de build.

## Netlify

Configure as variaveis acima em Site configuration > Environment variables.

Build command recomendado:

```bash
npm run build:observability
```

Publish directory:

```text
dist/info-shop-angular/browser
```

O script `npm run sentry:sourcemaps` injeta debug ids, envia sourcemaps ao Sentry e remove arquivos `.map` do artefato publicado, exceto quando `KEEP_SOURCEMAPS=true`.

## Supabase

1. Aplique as migrations para habilitar `pg_stat_statements`.
2. Confirme que as secrets das Edge Functions estao configuradas fora do Angular.
3. Use o Log Explorer filtrando por campos dos logs JSON:
   - `requestId`
   - `functionName`
   - `event`
   - `provider`
   - `status`
   - `durationMs`

Eventos principais:

```text
CHECKOUT_PAYMENT_STARTED
CHECKOUT_PAYMENT_CREATED
CHECKOUT_PAYMENT_FAILED
WEBHOOK_PAYMENT_SYNCED
WEBHOOK_PAYMENT_SYNC_FAILED
SHIPPING_QUOTE_CREATED
SHIPPING_CHECKOUT_COMPLETED
WEBHOOK_DELIVERY_SYNCED
HARDWARE_BENCHMARK_COMPLETED
NEWSLETTER_SUBSCRIBE_COMPLETED
```

Consulta para queries lentas:

```sql
SELECT
  calls,
  mean_exec_time::numeric(10, 2) AS avg_ms,
  max_exec_time::numeric(10, 2) AS max_ms,
  total_exec_time::numeric(10, 2) AS total_ms,
  query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

Consulta focada em queries frequentes e lentas:

```sql
SELECT
  calls,
  mean_exec_time::numeric(10, 2) AS avg_ms,
  total_exec_time::numeric(10, 2) AS total_ms,
  query
FROM pg_stat_statements
WHERE calls > 50
  AND mean_exec_time > 2
ORDER BY mean_exec_time DESC
LIMIT 20;
```

Alertas recomendados:

```text
P1: erro em mercado-pago-create-preference acima de 3% em 5 minutos.
P1: WEBHOOK_INVALID_SIGNATURE ou WEBHOOK_PAYMENT_SYNC_FAILED recorrente.
P2: durationMs acima de 1500 em catalogo/frete por 15 minutos.
P2: CPU acima de 80%.
P2: conexoes ativas acima de 85% do limite do plano.
P3: INP mobile acima de 300ms em dashboard semanal do Sentry.
```

## Correlacao

O front-end injeta `X-Request-ID` em chamadas Angular `HttpClient` e chamadas `supabase-js` proxied por `/api/supabase`. As Edge Functions registram o mesmo valor como `requestId` quando o header esta presente; webhooks externos sem esse header recebem um UUID gerado no backend.
