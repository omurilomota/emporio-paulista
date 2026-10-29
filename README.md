# Empório Paulista

Cardápio digital, marmitex montável e pedidos para restaurante.

> **Demonstração pública.** Telefones, WhatsApp, e-mail, endereço, CNPJ, redes sociais e dados de clientes são fictícios. Nenhum pedido, mensagem ou formulário é enviado a um canal real.

[**Ver demonstração**](https://emporio-paulista.vercel.app) · Next.js 16 (App Router) · React 19 · TypeScript · PostgreSQL + Drizzle ORM · Tailwind CSS 4

## O que tem

- Cardápio separado por almoço e jantar
- Marmitex montável com proteínas e guarnições
- Sacola persistente e checkout com retirada ou entrega
- Pedido formatado para WhatsApp
- Painel da equipe para acompanhar pedidos
- Página de privacidade e aviso de demonstração

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- PostgreSQL + Drizzle ORM
- Tailwind CSS 4

## Rodando localmente

```bash
npm ci
cp .env.example .env.local
# edite .env.local com a sua connection string
npm run dev
```

Acesse `http://localhost:3000`.

## Variáveis de ambiente

| Variável | Obrigatória | Para que serve |
| --- | --- | --- |
| `DATABASE_URL` | Sim | Connection string PostgreSQL/Neon |
| `ADMIN_PASSWORD` | Sim | Senha do painel da equipe |
| `ADMIN_SESSION_SECRET` | Sim | Segredo de assinatura da sessão |

## Banco de dados

PostgreSQL no Neon (banco `emporio`). O schema fica em `src/db/schema.ts` e é aplicado com `npx drizzle-kit push`. Em produção, use uma connection string Neon com `sslmode=require`.

## Rotas

| Rota | Descrição |
| --- | --- |
| `/` | Cardápio e checkout |
| `/admin` | Painel da equipe |
| `/privacidade` | Política de privacidade |

## Testes e qualidade

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Deploy

O deploy é feito na Vercel. Configure as variáveis acima no painel do projeto, conecte o repositório e use `npm run build`.

## Estrutura

| Caminho | Responsabilidade |
| --- | --- |
| `src/app/` | Rotas e API |
| `src/components/` | Storefront, painel e UI |
| `src/db/` | Schema Drizzle e seed |
| `src/lib/` | Menu, tipos e regras de pedido |
| `public/images/` | Fotos ilustrativas do cardápio |

## Licença

MIT — veja [LICENSE](LICENSE).
