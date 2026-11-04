# FortiCestas

Loja de cestas básicas com quatro composições iniciais, quiz de recomendação, painel administrativo, checkout Pix e frete grátis.

## Armazenamento

O catálogo, os produtos, as perguntas do quiz e os pedidos são salvos em um arquivo JSON no disco do servidor:

\`FORTI_STORAGE_DIR/forticestas.json\`

Se \`FORTI_STORAGE_DIR\` não for informado, o aplicativo usa \`./data/forticestas.json\`. O arquivo é criado na primeira alteração salva pelo painel ou pelo checkout. Faça backup periódico desse arquivo.

**Hospedagem obrigatória:** use um servidor Node.js com diretório persistente e permissão de escrita (por exemplo, VPS ou hospedagem própria). A Vercel usa funções serverless e não mantém gravações feitas no disco local entre execuções; este modo de armazenamento não é compatível com a Vercel para operações reais. Não publique a loja com pedidos habilitados nesse ambiente, pois os pedidos não ficariam persistidos.

## Configuração

Requisitos: Node.js 22.x.

1. Instale as dependências com \`npm install\`.
2. Copie \`.env.example\` para \`.env.local\`.
3. Configure:
   - \`FORTI_STORAGE_DIR\`: diretório persistente gravável pelo processo Node.
   - \`ADMIN_EMAIL\`, \`ADMIN_PASSWORD\` e \`ADMIN_SESSION_SECRET\`: credenciais do painel. O segredo precisa ter pelo menos 32 caracteres.
   - \`BRAVOPAY_API_KEY\` e \`BRAVOPAY_WEBHOOK_SECRET\`: credenciais do Pix.
   - \`NEXT_PUBLIC_SITE_URL\`: endereço público com HTTPS.
4. Garanta que o usuário do processo Node tenha permissão de escrita no diretório de armazenamento.
5. Execute \`npm run build\` e inicie com \`npm run start\` sob PM2 ou systemd.

O login administrativo fica em \`/admin/login\`.

## Pix e frete

O checkout cria uma cobrança Pix dinâmica pela BravoPay. Configure no painel da BravoPay o webhook:

\`https://SEU-DOMINIO/api/webhooks/bravopay\`

O endpoint valida a assinatura HMAC antes de mudar o status de um pedido. Pagamentos confirmados, expirados, reembolsados e chargebacks atualizam o arquivo local.

O frete está definido como grátis: o total enviado à BravoPay é igual ao preço da cesta. O CEP e o endereço continuam sendo solicitados para registrar o destino da entrega.

## Catálogo inicial

| Cesta | Preço sugerido |
|---|---:|
| Básica | R$ 89,90 |
| Econômica | R$ 159,90 |
| Tradicional | R$ 239,90 |
| Completa | R$ 349,90 |

Os preços e a composição são sugestões iniciais, não cotações de fornecedores. Valide custo dos alimentos, embalagem, operação e margem antes de aceitar pedidos.

O estoque fica disponível apenas no painel interno e não é exibido nas páginas públicas.

## Desenvolvimento

\`npm run dev\` inicia o ambiente local. As primeiras leituras usam o catálogo inicial; a primeira gravação cria \`data/forticestas.json\`.
