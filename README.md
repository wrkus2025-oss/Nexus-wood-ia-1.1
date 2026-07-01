# Nexus Wood AI 1.1

Plataforma profissional de marcenaria com IA — projetos paramétricos, plano de corte, orçamento e visualização 3D.

---

## Stack

| Camada    | Tecnologia                                      |
|-----------|-------------------------------------------------|
| Backend   | NestJS 11 · Prisma 7 · PostgreSQL 16 · Redis 7  |
| Frontend  | Next.js 16 · React 19 · TailwindCSS 4 · Three.js |
| Auth      | JWT (Passport)                                  |
| IA        | OpenAI GPT-4o-mini ou Ollama (local)            |

---

## Pré-requisitos

- **Node.js ≥ 20**
- **npm ≥ 10**
- **Docker + Docker Compose** (para banco de dados)

---

## Como rodar localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Subir banco de dados

```bash
docker compose up postgres redis -d
```

### 3. Configurar variáveis de ambiente da API

```bash
cp apps/api/.env.example apps/api/.env
```

Edite `apps/api/.env`:

```env
DATABASE_URL="******localhost:5432/nexus_wood"
JWT_SECRET="dev-secret-troque-em-producao"
PORT=3000
# Opcional — deixe em branco se não usar IA
OPENAI_API_KEY=""
OLLAMA_URL=""
```

### 4. Gerar Prisma Client e executar migrations

```bash
cd apps/api
DATABASE_URL="******localhost:5432/nexus_wood" npx prisma migrate dev --name init
DATABASE_URL="******localhost:5432/nexus_wood" npx prisma generate
```

### 5. Popular dados iniciais (seed)

```bash
# ainda dentro de apps/api
DATABASE_URL="******localhost:5432/nexus_wood" npm run seed
```

Isso cria:
- **5 materiais** MDF (Branco TX 18mm, Cinza Cimento 15mm, Carvalho 18mm, Freijó 25mm, Preto 6mm)
- **8 ferragens** (dobradiças Blum, corrediças Hafele, puxadores, suportes)
- **1 usuário admin**: `admin@nexuswood.com` / `nexus123`
- **1 projeto exemplo**: Armário de Cozinha — Família Silva

### 6. Iniciar API e Frontend

Em dois terminais separados:

```bash
# Terminal 1 — API (porta 3000)
npm run dev:api

# Terminal 2 — Frontend (porta 3001)
npm run dev:web
```

Abra **http://localhost:3001** no navegador.

> Login padrão: `admin@nexuswood.com` / `nexus123`

---

## Como rodar com Docker

```bash
docker compose up --build
```

Serviços:
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **API**: `http://localhost:3000`
- **Frontend**: `http://localhost:3001`

> Na primeira execução, rode as migrations manualmente após os containers subirem:
> ```bash
> docker compose exec api npx prisma migrate deploy
> docker compose exec api npm run seed
> ```

---

## Build e validação

```bash
# Build API
npm run build:api

# Build Web
npm run build:web

# Lint API
npm run lint:api

# Testes API
npm run test:api
```

---

## Login credentials

- **Usuário admin**: `admin@nexuswood.com`
- **Senha**: `nexus123`

---

## Módulos disponíveis

| Rota           | Descrição                                             |
|----------------|-------------------------------------------------------|
| `/`            | Login / Cadastro                                      |
| `/dashboard`   | Métricas de projetos, materiais e ferragens           |
| `/projects`    | Gestão de projetos (criar, listar, status)            |
| `/kanban`      | Kanban de produção com drag-and-drop por etapa        |
| `/materials`   | Biblioteca de materiais MDF                           |
| `/hardware`    | Biblioteca de ferragens                               |
| `/cut-plan`    | Plano de corte com nesting guilhotina + SVG/DXF       |
| `/budget`      | Orçamento com exportação profissional em PDF          |
| `/workspace`   | Projetista 3D paramétrico com visual premium          |
| `/ai`          | Assistente IA via OpenAI ou Ollama                    |

---

## Endpoints da API (porta 3000)

| Método | Rota                   | Descrição                    |
|--------|------------------------|------------------------------|
| POST   | `/auth/register`       | Criar conta                  |
| POST   | `/auth/login`          | Login → retorna accessToken  |
| GET    | `/auth/me`             | Dados do usuário logado      |
| GET    | `/projects`            | Listar projetos do usuário   |
| POST   | `/projects`            | Criar projeto                |
| PATCH  | `/projects/:id`        | Atualizar projeto            |
| DELETE | `/projects/:id`        | Remover projeto              |
| GET    | `/materials`           | Listar materiais             |
| POST   | `/materials`           | Criar material               |
| GET    | `/hardware`            | Listar ferragens             |
| POST   | `/hardware`            | Criar ferragem               |
| POST   | `/ai/assist`           | Consultar IA                 |

---

## Roadmap

1. **Multi-tenant** — separação de contas por empresa/marcenaria
2. **Gestão de estoque** — controle de chapas, sobras e ferragens
3. **Integração WhatsApp** — envio de orçamentos e aprovações
4. **Módulos paramétricos avançados** — cozinhas, closets e painéis completos
5. **Integração CNC/ERP** — filas de produção, etiquetas e apontamento fabril
6. **Relatórios gerenciais** — margem por projeto, produtividade e perdas reais
