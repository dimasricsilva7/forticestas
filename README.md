# FortiCestas

Loja de cestas básicas com catálogo, quiz de recomendação, painel administrativo, checkout Pix pela BravoPay e frete grátis.

## Hospedagem na Vercel

A aplicação foi preparada para funcionar em Vercel Functions com **Vercel Blob** como armazenamento permanente e compartilhado. Não exige VPS, Docker ou acesso SSH.

O projeto usa dois tipos de conteúdo no mesmo armazenamento Vercel Blob, na região de São Paulo:

- **Dados privados:** catálogo, produtos, cestas, conteúdo editável, perguntas do quiz, pedidos, estado de pagamentos e eventos processados são salvos em `data/forticestas.json`, com acesso privado.
- **Imagens:** uploads feitos pelo painel são salvos em `media/` no Blob privado. A rota pública `/api/media/[filename]` entrega somente os arquivos de imagem para que todos os visitantes vejam as fotos, sem expor os dados dos pedidos.

As gravações usam ETag/controle de concorrência para reduzir o risco de sobrescrever alterações simultâneas entre instâncias serverless. O armazenamento local em disco continua disponível apenas no desenvolvimento local/Docker; na Vercel, o app usa Blob e não tenta gravar no disco temporário da função.

### Configuração do projeto

O armazenamento Blob `forticestas-data-media` já foi criado e conectado a este projeto Vercel. A variável `BLOB_READ_WRITE_TOKEN` é gerenciada pela Vercel e não precisa ser copiada para o código nem exposta no navegador.

No painel Vercel, abra **forticestas → Settings → Environment Variables** e configure os seguintes valores para **Production** (e Preview, caso vá testar em preview):

| Variável | Valor |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | URL pública da loja, por exemplo `https://forticestas-dimasricsilva7s-projects.vercel.app` |
| `ADMIN_EMAIL` | E-mail que será usado para entrar no admin |
| `ADMIN_PASSWORD` | Senha forte e exclusiva do admin |
| `ADMIN_SESSION_SECRET` | Segredo aleatório com pelo menos 32 caracteres |
| `BRAVOPAY_API_KEY` | Chave privada da API BravoPay |
| `BRAVOPAY_WEBHOOK_SECRET` | Segredo de assinatura do webhook BravoPay |

Para gerar `ADMIN_SESSION_SECRET`, execute localmente `openssl rand -base64 48` e cole o resultado diretamente no painel da Vercel. Não publique essas credenciais no GitHub nem as inclua em variáveis iniciadas por `NEXT_PUBLIC_`.

**Não crie manualmente nem sobrescreva `BLOB_READ_WRITE_TOKEN`**: a conexão do Blob já provisionou essa variável para o projeto. Depois de cadastrar ou alterar as variáveis, faça um novo deploy/redeploy de Production para que as funções usem os valores.

### Inicialização e validação

Depois que a primeira versão for publicada, acesse `/api/health`. A rota inicializa o arquivo de dados no Blob na primeira execução e retorna `storage: "vercel-blob"` quando a conexão está correta.

Rotas úteis:

- Loja: `/`
- Login administrativo: `/admin/login`
- Catálogo público: `/api/catalog`
- Configuração pública do quiz: `/api/quiz-config`
- Health check: `/api/health`

### Configurar a BravoPay

No painel da BravoPay, cadastre este webhook:

```text
https://SEU-DOMINIO/api/webhooks/bravopay
```

A rota valida a assinatura antes de atualizar o status do pedido. Após cadastrar as credenciais no Vercel e o webhook no provedor, faça uma cobrança de teste de baixo valor e confira se o pedido muda para pago no admin antes de abrir vendas reais.

## Painel administrativo

O painel fica em `/admin/login`. As credenciais são exatamente as configuradas nas variáveis `ADMIN_EMAIL` e `ADMIN_PASSWORD` da Vercel.

O editor inclui conteúdo de home, catálogo, detalhe da cesta, quiz, resultado, checkout, identidade visual, textos, títulos, imagens, botões, links, benefícios e rodapé. Também permite gerenciar produtos, cestas, composição, perguntas e pedidos.

Os uploads aceitam JPG, PNG, WEBP, AVIF e GIF com até 8 MB. As imagens ficam persistidas no Blob e são servidas por uma URL do próprio site, então não dependem do disco temporário da função e aparecem para todos os usuários.

## Pix e frete

O checkout cria cobranças Pix dinâmicas pela BravoPay. As chaves ficam exclusivamente no servidor. O webhook valida a assinatura antes de atualizar o status do pagamento.

O frete está configurado como grátis: o total cobrado é igual ao preço da cesta. O lojista deve validar cobertura, prazos e custo real da entrega antes de receber pedidos.

## Catálogo inicial

| Cesta | Preço sugerido |
| --- | ---: |
| Básica | R$ 89,90 |
| Econômica | R$ 159,90 |
| Tradicional | R$ 239,90 |
| Completa | R$ 349,90 |

Preços e composições são sugestões iniciais, não cotações de fornecedores. Valide custo dos alimentos, embalagem, operação, margem e prazos de entrega antes da abertura da loja.

## Desenvolvimento local

Requisitos: Node.js 22.x.

```bash
npm install
npm run dev
```

Sem `BLOB_READ_WRITE_TOKEN`, o desenvolvimento local usa arquivos em `data/forticestas.json` e `data/uploads`. Para testar a integração com Blob localmente, use um token da Vercel em um arquivo `.env.local` privado e nunca o envie ao GitHub.

Antes de enviar alterações, execute:

```bash
npm run lint
npm run build
```
