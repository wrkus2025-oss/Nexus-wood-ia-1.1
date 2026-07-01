# Nexus Wood AI 1.1

Plataforma de marcenaria com IA para orçamento, plano de corte, gestão de produção e visualização 3D.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Backend | NestJS 11 · Prisma 7 · PostgreSQL 16 · Redis 7 |
| Frontend | Next.js 16 · React 19 · Tailwind CSS 4 · Three.js |
| Auth | JWT |
| IA | OpenAI ou Ollama |

## Release pronta para produção

- Subida completa via Docker Compose para **postgres**, **redis**, **api** e **web**
- Migrations e seed executados automaticamente na inicialização da API
- Exemplos de ambiente versionados para API e frontend
- Fluxo único para start completo com `npm start`

## Pré-requisitos

- Node.js 20+
- npm 10+
- Docker Engine com Docker Compose

## Start rápido

### Produção local com um comando

```bash
npm start
```

Para encerrar:

```bash
npm run stop
```

Serviços expostos:

- Web: `http://localhost:3001`
- API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

Login demo após o bootstrap:

- Usuário: `admin@nexuswood.com`
- Senha: `nexus123`

### Desenvolvimento local

1. Instale dependências:

   ```bash
   npm install
   ```

2. Copie os arquivos de ambiente:

   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   ```

3. Suba banco e cache:

   ```bash
   docker compose up postgres redis -d
   ```

4. Gere client, aplique migration e popule dados:

   ```bash
   cd apps/api
   npx prisma generate
   npx prisma migrate deploy
   npm run seed
   cd ../..
   ```

5. Inicie API e frontend em terminais separados:

   ```bash
   npm run dev:api
   npm run dev:web
   ```

## Ambientes

### API (`apps/api/.env.example`)

- `DATABASE_URL`: conexão PostgreSQL
- `JWT_SECRET`: segredo JWT
- `PORT`: porta da API
- `OPENAI_API_KEY` / `OPENAI_MODEL`: integração OpenAI
- `OLLAMA_URL` / `OLLAMA_MODEL`: integração Ollama

### Web (`apps/web/.env.example`)

- `NEXT_PUBLIC_API_URL`: URL pública da API
- `PORT`: porta do frontend

## Demo e screenshots

### Fluxo de demo sugerido

1. Acesse `http://localhost:3001`
2. Entre com `admin@nexuswood.com` / `nexus123`
3. Mostre o **Dashboard** com métricas gerais
4. Abra **Projects** e destaque o projeto demo
5. Navegue no **Kanban** para apresentar o fluxo de produção
6. Abra **Cut Plan** para mostrar o nesting e exportações
7. Finalize em **Workspace 3D** e no módulo **AI**

### Screenshots recomendadas para release

- Tela de login
- Dashboard
- Lista de projetos
- Kanban de produção
- Plano de corte
- Workspace 3D

## Estrutura funcional

| Rota | Descrição |
| --- | --- |
| `/` | Login e cadastro |
| `/dashboard` | Métricas operacionais |
| `/projects` | Gestão de projetos |
| `/kanban` | Pipeline de produção |
| `/materials` | Catálogo de materiais |
| `/hardware` | Catálogo de ferragens |
| `/cut-plan` | Plano de corte |
| `/budget` | Orçamentos em PDF |
| `/workspace` | Modelagem 3D |
| `/ai` | Assistente com IA |

## API principal

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/auth/register` | Criar conta |
| POST | `/auth/login` | Autenticar e obter token |
| GET | `/auth/me` | Usuário autenticado |
| GET | `/projects` | Listar projetos |
| POST | `/projects` | Criar projeto |
| PATCH | `/projects/:id` | Atualizar projeto |
| DELETE | `/projects/:id` | Remover projeto |
| GET | `/materials` | Listar materiais |
| POST | `/materials` | Criar material |
| GET | `/hardware` | Listar ferragens |
| POST | `/hardware` | Criar ferragem |
| POST | `/ai/assist` | Consultar IA |
| GET | `/health` | Healthcheck |

## Validação

```bash
npm run lint:api
npm run lint:web
npm run test:api
npm run build:api
npm run build:web
```
