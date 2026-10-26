# Envio para impressão

Aplicação web que recebe PDF, JPG, PNG ou TXT (até 10 MB) e envia o arquivo como anexo por SMTP ao endereço Epson Connect configurado. Ela confirma apenas a entrega do e-mail ao servidor SMTP; a impressão física depende do Epson Connect.

## Configuração

1. Instale o [Node.js LTS](https://nodejs.org/).
2. No diretório do projeto, rode `npm install`.
3. Copie `.env.example` para `.env` e preencha `SMTP_PASS` com a senha de app da conta Gmail remetente. Para criá-la, a conta precisa ter verificação em duas etapas e uma [senha de app do Google](https://myaccount.google.com/apppasswords).
4. Rode `npm start` e abra `http://localhost:3000`.

As credenciais ficam somente no `.env`, que está no `.gitignore`. Não publique esse arquivo. O remetente e o destinatário já estão definidos no exemplo, mas podem ser ajustados no ambiente do servidor.

## Publicação

Publique o projeto em um host que execute Node.js (Render, Railway, Fly.io ou VPS) e cadastre as mesmas variáveis de `.env` no painel de variáveis secretas da plataforma. Não hospede apenas os arquivos de `public/`: o backend é necessário para preservar as credenciais e enviar o anexo.

## Segurança implementada

- Validação no navegador e no servidor, incluindo extensão, MIME e assinatura de arquivos binários.
- Upload em memória, sem arquivos temporários persistidos.
- Limite de 10 MB e até 10 envios por IP a cada 15 minutos.
- Nomes de anexos sanitizados e falhas SMTP tratadas sem vazar detalhes internos.
