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
- O adaptador BravoPay está em `src/lib/integrations/bravopay.ts`. É um ponto de integração, não uma conexão ativa.
- O adaptador de frete está em `src/lib/integrations/shipping.ts`. O provedor ainda precisa ser escolhido.
- Não habilite cobrança até implementar criação de cobrança, validação criptográfica do webhook e idempotência.
- O status `paid` só deve ser atribuído após confirmação autenticada do provedor.
- O valor e a disponibilidade do frete precisam vir de cotação real antes de criar o pedido.

## Importante
O projeto está em etapa de MVP. O catálogo e o painel dependem da configuração do Supabase. Ainda não está pronto para receber pagamentos ou expedir pedidos. Não publique credenciais em commits, tickets ou mensagens.
