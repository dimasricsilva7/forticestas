# FortiCestas

Loja de cestas básicas com catálogo, quiz de recomendação, painel administrativo, checkout Pix pela BravoPay e frete grátis.

## Hospedagem de produção

A aplicação persiste catálogo, conteúdo da página, produtos, perguntas, pedidos e imagens em arquivos no disco. Ela precisa de um servidor Node.js com armazenamento persistente e deve rodar em **um único processo/contêiner**. Não use Vercel Serverless para receber pedidos com esta implementação: o disco das funções não é persistente e a aplicação recusa gravações nesse ambiente.

Foi incluído um setup Docker para VPS.

### Deploy em VPS com Docker

Requisitos: Linux com Docker Engine e Docker Compose Plugin instalados; domínio apontado para o IP do servidor; proxy reverso HTTPS (Nginx ou Caddy).

1. Clone o repositório e entre na pasta:

   ```bash
   git clone https://github.com/dimasricsilva7/forticestas.git
   cd forticestas
   git checkout main
   ```

2. Crie o arquivo privado de variáveis:

   ```bash
   cp .env.production.example .env
   nano .env
   ```

3. Configure `NEXT_PUBLIC_SITE_URL` com o domínio final, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `BRAVOPAY_API_KEY` e `BRAVOPAY_WEBHOOK_SECRET`. Gere um segredo de sessão com:

   ```bash
   openssl rand -base64 48
   ```

   Use uma senha administrativa forte e exclusiva. Nunca comite o arquivo `.env`.

4. Construa e inicie o serviço:

   ```bash
   docker compose up -d --build
   docker compose ps
   ```

5. Configure o proxy reverso para encaminhar HTTPS na porta 443 para `127.0.0.1:3000`. O serviço de aplicação escuta na porta 3000 e possui health check em `/api/health`.

6. No painel BravoPay, cadastre o webhook `https://SEU-DOMINIO/api/webhooks/bravopay`. Faça uma cobrança real de baixo valor e confirme o evento recebido antes de aceitar pedidos reais.

O volume Docker `forticestas_data` guarda `forticestas.json` e a pasta `uploads`; ele sobrevive a recriações do contêiner. Não remova esse volume ao atualizar a imagem.

### Backup

Execute periodicamente:

```bash
sh scripts/backup-data.sh
```

O arquivo de backup será salvo em `backups/`. Copie esses arquivos para outro destino seguro. Para restaurar, pare o serviço, extraia o backup no volume `forticestas_data` e inicie novamente.

### Deploy manual pelo GitHub Actions

Depois do primeiro bootstrap do VPS descrito acima, é possível publicar atualizações sem compartilhar a chave SSH no chat. Em **GitHub → Settings → Secrets and variables → Actions**, crie:

- `VPS_HOST`: IP ou hostname SSH do VPS.
- `VPS_USER`: usuário SSH do servidor.
- `VPS_SSH_KEY`: chave privada SSH do runner.
- `VPS_SSH_KNOWN_HOSTS`: linha de host key do servidor, obtida previamente com `ssh-keyscan -H SEU_HOST`.
- `VPS_SSH_PORT`: opcional; padrão 22.

A chave pública correspondente precisa estar no `~/.ssh/authorized_keys` do usuário do VPS. Esse usuário deve poder executar Docker e Docker Compose sem prompt interativo. Não envie nem comite a chave privada.

Depois, execute **GitHub → Actions → Deploy FortiCestas to VPS → Run workflow**. O fluxo verifica a conexão SSH, faz backup do volume de dados quando a aplicação já está em execução, atualiza o código de `main`, reconstrói o contêiner e valida `/api/health`. A publicação é manual, não automática.

O arquivo privado `.env` deve estar previamente configurado em `$HOME/forticestas` no servidor. O workflow não cria nem sobrescreve credenciais.


### Persistência e concorrência

O armazenamento JSON usa uma fila de escrita dentro do processo Node. Por isso, rode exatamente uma instância da aplicação e não habilite cluster/replicas múltiplas. Para escalar horizontalmente, será necessário migrar para um banco de dados transacional.

## Painel administrativo

Acesse `/admin/login` com o e-mail e a senha configurados no arquivo privado `.env`. O painel inclui:

- Edição de conteúdo nas páginas públicas: home, catálogo, detalhe da cesta, quiz, resultado, checkout, identidade, títulos, textos, imagens, botões, links, benefícios e rodapé.
- Edição de imagens por URL HTTPS ou upload de JPG, PNG, WEBP, AVIF e GIF (até 8 MB).
- Gerenciamento de produtos, cestas, composição, perguntas do quiz e pedidos.
- Imagens enviadas pelo painel são gravadas no volume persistente do servidor.

## Pix e frete

O checkout cria cobranças Pix dinâmicas pela BravoPay. As credenciais são exclusivamente server-side. O webhook valida a assinatura antes de atualizar o status de pagamento.

O frete está configurado como grátis: o total cobrado é igual ao preço da cesta. O lojista deve validar a cobertura, prazos e custo real da entrega antes de receber pedidos.

## Catálogo inicial

| Cesta | Preço sugerido |
|---|---:|
| Básica | R$ 89,90 |
| Econômica | R$ 159,90 |
| Tradicional | R$ 239,90 |
| Completa | R$ 349,90 |

Preços e composições são sugestões iniciais, não cotações de fornecedores. Valide custo dos alimentos, embalagem, operação, margem e prazos de entrega antes da abertura da loja.

## Desenvolvimento

Requisitos: Node.js 22.x.

```bash
npm install
npm run dev
```

O arquivo `data/forticestas.json` é criado na primeira gravação. Use `npm run lint` e `npm run build` antes de publicar alterações.
