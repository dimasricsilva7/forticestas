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

## Pagamento e frete
- O adaptador BravoPay em `src/lib/integrations/bravopay.ts` já implementa criação de cobrança PIX na API v1 e validação HMAC-SHA256 do webhook.
- O endpoint de recebimento é `POST /api/webhooks/bravopay`. Cadastre essa URL no Dashboard BravoPay > Integrações e copie o segredo `whsec_...` para `BRAVOPAY_WEBHOOK_SECRET`.
- Configure `BRAVOPAY_API_KEY` com a chave de cobranças `bp_live_...`. Ambas são variáveis privadas de servidor, nunca prefixadas com `NEXT_PUBLIC_`.
- A criação de cobrança usa `Idempotency-Key`; os eventos são deduplicados pelo ID estável do webhook. O pedido só muda para pago após evento assinado `transaction.paid`, conferência do ID da transação e conferência do valor total.
- Consulte a [documentação oficial BravoPay](https://bravopay.club/docs) para conferir os dados da conta e cadastrar o webhook.
- O adaptador de frete está em `src/lib/integrations/shipping.ts`. O provedor nacional ainda precisa ser escolhido e configurado.
- Não habilite vendas até integrar uma cotação real de frete e conectar o endpoint de checkout à transportadora. Não aceite preço ou status de frete enviado pelo navegador.
- O status `paid` nunca deve ser atribuído por ação do cliente ou pela página de retorno do checkout.

## Importante
O projeto está em etapa de MVP. O catálogo e o painel dependem da configuração do Supabase. Ainda não está pronto para receber pagamentos ou expedir pedidos. Não publique credenciais em commits, tickets ou mensagens.
