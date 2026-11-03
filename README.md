# FortiCestas

Loja de cestas básicas com recomendação por quiz, catálogo administrável e estrutura para checkout Pix.

## Stack
- Next.js 15.5 + React 19 + TypeScript
- Tailwind CSS 4
- Supabase Auth + Postgres
- Vercel com deploy automático conectado ao GitHub

## Rodar localmente
```bash
npm install
cp .env.example .env.local
npm run dev
```
Abra http://localhost:3000.

## Rotas
- `/` — página inicial
- `/quiz` — questionário de perfil com consulta de CEP via ViaCEP
- `/resultado` — resumo inicial das respostas
- `/cestas` — catálogo de cestas ativas no Supabase
- `/cestas/[slug]` — composição e preço de uma cesta
- `/admin/login` — acesso administrativo
- `/admin` — painel protegido para produtos, cestas, pedidos e métricas

## Supabase — configuração obrigatória
1. Crie um projeto Supabase.
2. Em SQL Editor, execute o arquivo `supabase/schema.sql` inteiro.
3. Em Authentication > Users, crie seu usuário administrador com e-mail e senha.
4. Copie o UUID desse usuário e execute no SQL Editor:
   ```sql
   insert into public.admin_users (user_id)
   values ('UUID_DO_USUARIO_CRIADO_NO_AUTH');
   ```
5. Configure na Vercel (Settings > Environment Variables) e em `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (somente servidor; nunca use prefixo NEXT_PUBLIC_)
6. Faça redeploy depois de cadastrar as variáveis.

As rotas administrativas validam sessão Supabase Auth e associação à tabela `admin_users`. O acesso de leitura do usuário autenticado à própria linha é limitado por RLS. Operações administrativas usam service-role exclusivamente no servidor.

## Checkout, pagamento e frete
- A página por cesta é `/checkout/[slug]`; o endpoint do servidor é `POST /api/checkout`.
- O checkout consulta a cesta e o estoque no banco, consulta o CEP no ViaCEP e exige uma cotação do adaptador de frete antes de criar o pedido ou a cobrança.
- Cadastre o peso real (gramas), largura, altura e comprimento (centímetros) de cada produto no painel administrativo. O checkout bloqueia o pedido quando algum dado logístico obrigatório estiver ausente.
- O adaptador BravoPay em `src/lib/integrations/bravopay.ts` implementa criação de cobrança PIX na API v1, header `Idempotency-Key` e validação HMAC-SHA256 do webhook.
- O endpoint de recebimento é `POST /api/webhooks/bravopay`. Cadastre a URL pública completa no Dashboard BravoPay > Integrações e copie o segredo `whsec_...` para `BRAVOPAY_WEBHOOK_SECRET`.
- Configure `BRAVOPAY_API_KEY` com a chave de cobranças `bp_live_...`. Ambas são variáveis privadas de servidor, nunca prefixadas com `NEXT_PUBLIC_`.
- Os eventos são deduplicados pelo ID estável. O pedido só muda para pago após webhook assinado `transaction.paid`, conferência do ID da transação e conferência do valor.
- Consulte a [documentação oficial BravoPay](https://bravopay.club/docs) para ver endpoint, escopos da chave e cadastrar o webhook.
- O adaptador de frete usa Melhor Envio em `src/lib/integrations/melhor-envio.ts`, com OAuth2, renovação automática e tokens armazenados criptografados no banco.
- Cadastre o aplicativo em Melhor Envio > Integrações > Área Dev. Use o callback exato `https://SEU-DOMINIO/api/admin/shipping/melhor-envio/callback` e solicite apenas o scope `shipping-calculate`.
- Configure na Vercel: `MELHORENVIO_CLIENT_ID`, `MELHORENVIO_CLIENT_SECRET`, `MELHORENVIO_REDIRECT_URI`, `MELHORENVIO_USER_AGENT_EMAIL`, `MELHORENVIO_TOKEN_ENCRYPTION_KEY`, `SHIPPING_ORIGIN_CEP`, `MELHORENVIO_ENV` e `SHIPPING_PROVIDER=melhor_envio`.
- Gere a chave de criptografia com `openssl rand -hex 32`. Ela deve permanecer secreta e estável; trocar a chave sem reautorizar a integração impede a leitura dos tokens já armazenados.
- Defina `MELHORENVIO_ENV=sandbox` para homologar. Depois, crie/configure o aplicativo de produção, ajuste o callback cadastrado e troque para `production` somente após testar a autorização e as cotações.
- Em seguida, entre em `/admin` e clique em **Conectar Melhor Envio**. A conta autorizada é a conta remetente da loja; o CEP de origem deve ser o endereço real de expedição.
- O checkout envia medidas em cm, peso em kg e valor segurado unitário por produto ao endpoint de cotação. Usa `custom_price` e `custom_delivery_time` quando retornados pela API. A compra de etiquetas não está habilitada.
- Consulte a [documentação oficial de autorização](https://docs.melhorenvio.com.br/reference/fluxo-de-autoriza%C3%A7%C3%A3o), [solicitação/renovação de token](https://docs.melhorenvio.com.br/reference/solicitacao-do-token) e [cálculo de fretes](https://docs.melhorenvio.com.br/reference/calculo-de-fretes-por-produtos).
- Não aceite preço ou status de frete enviado pelo navegador. O serviço, preço e prazo devem vir da API do transportador no servidor.
- O status `paid` nunca deve ser atribuído por ação do cliente ou pela página de retorno do checkout.

## Importante
O projeto está em etapa de MVP. O catálogo e o painel dependem da configuração do Supabase. Ainda não está pronto para receber pagamentos ou expedir pedidos. Não publique credenciais em commits, tickets ou mensagens.
