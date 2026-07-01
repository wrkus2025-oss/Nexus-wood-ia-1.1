# Nexus Wood AI

Plataforma profissional para marcenaria com frontend em Next.js e backend em NestJS.

## Stack

- Frontend: Next.js, React, TypeScript, TailwindCSS, Zustand, React Query, Framer Motion, Three.js, React Three Fiber, Drei
- Backend: NestJS, PostgreSQL, Prisma ORM, Redis, WebSocket-ready
- IA: integração com OpenAI e Ollama (configurável)

## Estrutura

- `/apps/web`: aplicação web
- `/apps/api`: API NestJS
- `/docker-compose.yml`: PostgreSQL + Redis

## Execução local

1. Subir banco e cache:
   ```bash
   docker compose up -d
   ```
2. Configurar variáveis:
   - Copiar `/apps/api/.env.example` para `/apps/api/.env`
   - Copiar `/apps/web/.env.example` para `/apps/web/.env.local`
3. Aplicar schema Prisma:
   ```bash
   cd /home/runner/work/Nexus-wood-ia-1.1/Nexus-wood-ia-1.1/apps/api
   npx prisma migrate dev --name init
   ```
4. Iniciar API:
   ```bash
   cd /home/runner/work/Nexus-wood-ia-1.1/Nexus-wood-ia-1.1
   npm run dev:api
   ```
5. Iniciar Web:
   ```bash
   cd /home/runner/work/Nexus-wood-ia-1.1/Nexus-wood-ia-1.1
   npm run dev:web
   ```

## Módulos implementados

- Autenticação: cadastro, login, recuperação de senha, perfil autenticado
- Perfis: ADMIN, DESIGNER, PRODUCTION, SALES
- Projetos: CRUD base com status de produção
- Materiais: CRUD base com fabricante, categoria, espessura e custo
- Ferragens: CRUD base com fabricante, código e custo
- IA Nexus Master: endpoint de assistência com OpenAI/Ollama e histórico por usuário
- Interface web com dashboard, gestão de projetos, materiais, ferragens, assistente IA e workspace 3D

## Observações

- O módulo 3D e os módulos de engenharia/plano de corte foram estruturados com base funcional inicial para evolução incremental.
- O backend está pronto para expansão SaaS multiusuário com autenticação JWT e persistência relacional.
