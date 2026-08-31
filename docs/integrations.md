# Integrações

## Mercado Pago

Funções:

- `mercado-pago-create-preference`: cria pedido, pagamento e preferência de checkout.
- `mercado-pago-webhook`: sincroniza eventos de pagamento.

Variáveis comuns:

- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET`
- `PUBLIC_SITE_URL`

O fluxo de checkout é iniciado pelo Angular via `PaymentService`, passando pelo proxy Supabase e chegando à Edge Function autenticada.

## Melhor Envio

Funções:

- `melhor-envio-auth`: autorização OAuth.
- `melhor-envio-quote`: cotação de frete para o carrinho.
- `melhor-envio-checkout`: contratação/envio.
- `melhor-envio-webhook`: atualização de entrega.

Variáveis comuns:

- `ME_CLIENT_ID`
- `ME_CLIENT_SECRET`
- `ME_BASE_URL`
- `ME_REDIRECT_URI`
- `ME_USER_AGENT`

## Gemini

Função:

- `hardware-benchmark-chat`: compara o hardware atual do cliente com o produto selecionado.

Variável:

- `GEMINI_API_KEY`

A função limita escopo para benchmark, gargalos, compatibilidade, upgrade, downgrade e custo-benefício de hardware.

## Newsletter

Função:

- `newsletter-subscribe`: registra inscrição e opcionalmente envia e-mail de boas-vindas.

Variáveis opcionais:

- `BREVO_API_KEY`
- `BREVO_NEWSLETTER_TEMPLATE_ID`

## Sentry

Usado no Angular por `@sentry/angular` e no build por upload de sourcemaps.

Variáveis principais:

- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT`
- `SENTRY_RELEASE`
- `SENTRY_TRACES_SAMPLE_RATE`
- `SENTRY_REPLAYS_SESSION_SAMPLE_RATE`
- `SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`

Detalhes operacionais estão em [observability.md](observability.md).
