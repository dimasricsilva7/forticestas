# FortiCestas

Loja de cestas básicas com experiência de recomendação por quiz, catálogo administrável e checkout Pix.

## Stack

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS 4
- Supabase (Postgres, Auth e Storage) — preparado, ainda não conectado
- Vercel — destino de deploy

## Rodar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra http://localhost:3000.

## Rotas iniciais

- `/` — página inicial
- `/quiz` — questionário de perfil e consulta de CEP via ViaCEP
- `/resultado` — resumo da recomendação (não simula estoque nem frete real)
- `/admin` — esqueleto visual do painel administrativo (não protegido; demonstração apenas)

## Configurações obrigatórias antes de produção

1. Criar projeto Supabase e preencher as variáveis do `.env.example`.
2. Aplicar o schema em `supabase/schema.sql`.
3. Implementar autenticação e autorização do painel; nunca publicar o painel administrativo sem proteção.
4. Definir provedor de frete e implementar cotação/etiquetas via API.
5. Integrar BravoPay exclusivamente no servidor, validar assinatura do webhook e só marcar pedido como pago após confirmação autenticada.
6. Cadastrar produtos, preços, imagens, estoque e composição real das cestas.
7. Configurar domínio, URL pública, políticas de privacidade, termos e informações comerciais.

## Integrações

As credenciais não devem ser versionadas. Use variáveis de ambiente na Vercel. O token de serviço do Supabase e as chaves da BravoPay devem permanecer apenas no servidor. O navegador nunca deve receber segredos.

## Estado do projeto

Este commit disponibiliza a estrutura inicial de interface e organização. Não é uma loja pronta para receber pagamentos: catálogo, administração segura, checkout BravoPay, frete e webhooks ainda precisam ser implementados e testados.
