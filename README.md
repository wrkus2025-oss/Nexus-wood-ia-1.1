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

## Modo desenvolvimento (recomendado)

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

## Modo Docker Compose (completo)

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

## Módulos disponíveis

| Rota           | Descrição                                             |
|----------------|-------------------------------------------------------|
| `/`            | Login / Cadastro                                      |
| `/dashboard`   | Métricas de projetos, materiais e ferragens           |
| `/projects`    | Gestão de projetos (criar, listar, status)            |
| `/materials`   | Biblioteca de materiais MDF                           |
| `/hardware`    | Biblioteca de ferragens                               |
| `/cut-plan`    | Plano de corte com visualização de chapas             |
| `/budget`      | Orçamento com margem de lucro configurável            |
| `/workspace`   | Projetista 3D paramétrico (Three.js)                  |
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

## Próximos módulos recomendados

1. **Nesting automático** — algoritmo de otimização de corte (guilhotina ou heurística)
2. **Orçamento PDF** — geração de proposta comercial em PDF
3. **Kanban de produção** — quadro de etapas com drag-and-drop
4. **Multi-tenant** — separação de contas por empresa/marcenaria
5. **Gestão de estoque** — controle de chapas e ferragens em estoque
6. **Integração WhatsApp** — envio de orçamentos via API
7. **Módulos de cozinha paramétrica** — torres, balcões e aéreos configuráveis
8. **Exportação DXF/SVG** — arquivos de corte para CNC
