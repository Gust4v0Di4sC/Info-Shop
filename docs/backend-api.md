# Backend e API

## BFF Express

O arquivo `src/api-app.ts` cria a aplicação Express compartilhada por SSR local e Netlify Functions.

Responsabilidades:

- Compressão HTTP.
- Headers de segurança.
- Validação de origem para métodos que alteram estado.
- Endpoints de autenticação em `/api/auth/*`.
- Endpoints públicos de produtos em `/api/public/products`.
- Proxy Supabase em `/api/supabase/*`.
- Fallbacks locais para algumas Edge Functions em desenvolvimento.

## Endpoints de Autenticação

- `GET /api/auth/session`: retorna usuário atual ou `null`.
- `POST /api/auth/login`: autentica com e-mail/senha.
- `POST /api/auth/register`: cria usuário e perfil público.
- `POST /api/auth/resend-confirmation`: reenvia confirmação de cadastro.
- `POST /api/auth/password-reset`: inicia reset de senha.
- `POST /api/auth/update-password`: atualiza senha do usuário autenticado.
- `POST /api/auth/logout`: encerra sessão.
- `GET /api/auth/oauth/google`: inicia OAuth Google.
- `POST /api/auth/callback`: troca code/token hash por sessão segura.

## Endpoints Públicos

- `GET /api/public/products`: lista produtos públicos, com `category`, `q`, `featured` e `limit`.
- `GET /api/public/products/:id`: carrega produto por id.
- `GET /api/public/products/offer`: carrega oferta ativa mais recente.

Esses endpoints existem para evitar exposição direta de detalhes de query Supabase no fluxo público e para aplicar cache HTTP controlado.

## Proxy Supabase

O browser chama Supabase normalmente pelo `supabase-js`, mas `supabase.client.ts` reescreve chamadas elegíveis para `/api/supabase`.

Prefixos permitidos:

- `/rest/v1/`
- `/storage/v1/`
- `/functions/v1/`

O proxy remove `authorization` e `apikey` enviados pelo browser, copia headers seguros, injeta anon key e usa o access token da sessão HttpOnly quando disponível.

## SSR Local e Netlify

- `src/server.local.ts`: usa `AngularNodeAppEngine`, serve assets de `dist/info-shop-angular/browser` e responde com SSR.
- `src/server.ts`: usa `AngularAppEngine` da Netlify; chamadas `/api` são encaminhadas para a função Netlify.
- `netlify/functions/api.ts`: adapta o Express para serverless com `serverless-http`.

## Fallbacks Locais

Em desenvolvimento, o BFF possui fallbacks para:

- `melhor-envio-quote`: cria opções locais de frete.
- `hardware-benchmark-chat`: gera resposta local quando a função/IA não responde.
- `mercado-pago-create-preference`: cria retorno local para serviços `local-*`.

Esses fallbacks não rodam em produção.
