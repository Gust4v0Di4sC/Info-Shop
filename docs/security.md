# Segurança

## Sessão

A sessão Supabase não é persistida no browser pelo `supabase-js`.

Configuração relevante:

- `persistSession: false`
- `autoRefreshToken: false`
- `detectSessionInUrl: false`
- `flowType: 'pkce'`

O BFF usa `@supabase/ssr` para gravar cookies:

- `HttpOnly`
- `SameSite=Lax`
- `Secure` em produção
- `path=/`

## Proteção do BFF

`src/api-app.ts` aplica:

- `Strict-Transport-Security` em produção.
- `Content-Security-Policy`.
- `X-Frame-Options: DENY`.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` restritiva.

Métodos `POST`, `PUT`, `PATCH` e `DELETE` em `/api` rejeitam `Origin` diferente da origem do site.

## Service Role

`SUPABASE_SERVICE_ROLE_KEY` nunca deve ser usada no Angular, em `src/environments/*`, em `.env.local` servido ao build de frontend ou em variáveis públicas Netlify.

Ela deve ficar apenas como secret das Supabase Edge Functions.

## Proxy Supabase

O client browser não envia diretamente `apikey` ou `authorization` para o upstream Supabase. O proxy remove esses headers e injeta credenciais no servidor.

Somente estes prefixos são permitidos:

- `/rest/v1/`
- `/storage/v1/`
- `/functions/v1/`

## RLS

RLS é parte essencial da segurança. A anon key é pública por natureza; o isolamento real vem de:

- políticas de usuário proprietário;
- políticas administrativas por papel;
- restrição por `store_id`;
- validações de Edge Functions com usuário autenticado;
- uso de service role somente em funções confiáveis.

## Rate Limit

Edge Functions usam `edge_rate_limits` com escopos por fluxo, por exemplo:

- `mercado-pago-create-preference`
- `melhor-envio-quote`
- `hardware-benchmark-chat`
- `newsletter-subscribe`

O objetivo é reduzir abuso em integrações com custo, checkout, IA e newsletter.
