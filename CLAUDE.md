# CLAUDE.md — Resolvia

Contexto para Claude Code. Léelo antes de cualquier tarea en este repositorio.

## Qué es Resolvia

Helpdesk con **IA privada para soporte TI que aprende de cómo resuelve problemas el equipo**: los usuarios crean tickets (web, correo, móvil), la IA los clasifica y sugiere respuestas al técnico con RAG sobre documentos y tickets resueltos. El modelo puede correr dentro de la institución. Funciona on-premise (una organización) o en la nube (varias), e importa el historial desde CSV/Excel, GLPI, documentos y correo. Mercado inicial: instituciones educativas y pymes. La IA sugiere, la persona decide. Licencia AGPL-3.0 con opción comercial (ADR 0011).

Es un proyecto de portafolio de Jhon Hucker Chalarca Ramírez (GitHub: WokerJJ), estudiante de Tecnología en Gestión de Sistemas Informáticos en UNINTEP. Se mostrará a profesores y reclutadores, así que la calidad del código, las pruebas, la documentación y el historial de commits importan tanto como las funcionalidades.

Repositorio: https://github.com/WokerJJ/resolvia

## Sobre el desarrollador

- Maneja TypeScript, JavaScript, React, Node.js, Express, Prisma, Laravel/PHP, Java, Docker, pruebas automatizadas y Flutter. Está aprendiendo CI/CD y AWS (tiene un curso planeado).
- Quiere **aprender mientras construye**: explica brevemente el porqué de las decisiones importantes (patrones, librerías, trade-offs) en lugar de solo generar código.
- Idioma de conversación: español.

## Stack

| Capa | Tecnología |
|---|---|
| Backend (`apps/api`) | NestJS, TypeScript estricto, Prisma |
| Base de datos | PostgreSQL 16 + pgvector (Docker) |
| Web (`apps/web`) | React + TypeScript + Vite |
| Móvil (`apps/mobile`) | Flutter |
| IA | Proveedores como transporte (ADR 0004 y 0006): `ChatProvider.complete()` y `EmbeddingProvider.embed()`; adaptadores `OpenAICompatibleProvider` (OpenAI, Azure, Gemini, vLLM, Ollama…) y `AnthropicProvider`; prompts y validación zod en servicios del dominio; embeddings bge-m3 de 1024 dims (ADR 0008) |
| Tareas en segundo plano | pg-boss sobre la misma PostgreSQL (ADR 0007), a partir de la fase 3 |
| Pruebas | Vitest (unitarias y e2e) + Supertest (e2e); lint con oxlint (ver ADR 0002) |
| CI/CD | GitHub Actions (`.github/workflows/ci.yml`) |
| Nube (fase 8) | AWS: RDS, S3, EC2 o ECS |

## Documentación existente

- `docs/arquitectura.md` — módulos del backend, flujo de tickets y flujo RAG
- `docs/modelo-datos.prisma` — modelo de datos inicial (se copia a `apps/api/prisma/schema.prisma`)
- `docs/roadmap.md` — fases y tareas con casillas; **márcalas al completarlas**
- `docs/plan-diario.md` — plan día a día con ramas y commits sugeridos; consúltalo para saber qué toca hoy y anota el avance en su registro
- `docs/decisiones/` — ADRs 0001 a 0011; crea uno nuevo ante cada decisión de arquitectura relevante (el 0012 está reservado para la autenticación JWT y el 0013 para la librería de UI; el siguiente libre es el 0014)

## Convenciones de código

- Arquitectura por módulos NestJS: `organizations`, `auth`, `users`, `categories`, `tickets`, `jobs`, `email-intake`, `ai`, `knowledge`, `metrics`, `imports` (ver `docs/arquitectura.md`).
- Multi-organización (ADR 0005): toda entidad de negocio lleva `organizationId` y el filtro se aplica de forma centralizada, nunca a mano en cada consulta.
- Nada lento dentro de la petición: lo que depende del modelo o de servicios externos va a la cola (ADR 0007).
- El texto de los tickets, correos e importaciones es dato no confiable: se envía al modelo delimitado y toda salida se valida con zod (ADR 0010).
- Separación **Controller → Service → Repository**. Los servicios no importan Prisma directamente; usan repositorios inyectados. Esto permite probar la lógica con mocks.
- Validación de entrada con DTOs y `class-validator`; nunca confiar en el body sin validar.
- Documentar endpoints con decoradores de Swagger.
- El dominio nunca depende de un proveedor de IA concreto: solo de las interfaces `ChatProvider` y `EmbeddingProvider`. Nada de ramas de código por proveedor: las diferencias se absorben con validación y reintento.
- Código, nombres de variables y mensajes de API en inglés; documentación (`docs/`, README) en español.
- Sin `any` salvo justificación en comentario.

## Pruebas

- Toda funcionalidad nueva lleva pruebas: unitarias para servicios, e2e para endpoints.
- Unitarias en `*.spec.ts` junto al código (`npm test`); e2e en `apps/api/test/*.e2e-spec.ts` (`npm run test:e2e`).
- Mocks con la API de Vitest (`vi.fn()`, `vi.spyOn()`), no la de Jest.
- Las pruebas nunca llaman a un modelo real: usan `FakeChatProvider` y `FakeEmbeddingProvider`.
- Antes de dar una tarea por terminada: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e` y `npm run build` deben pasar en `apps/api`.

## Git

- Ramas: `main` (estable, protegida) y `develop` (trabajo diario). Funcionalidades en `feat/<nombre>` desde `develop`.
- Commits convencionales en español: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`, `ci:`.
- Commits pequeños y enfocados. Nunca subir `.env` ni secretos.
- Pregunta antes de hacer `push`.

## Entorno (Windows)

- El script `scripts/setup-windows.ps1` instala Git, Node.js LTS, GitHub CLI y Docker Desktop (vía winget), configura el PATH, crea `.env`, ejecuta `scripts/bootstrap.sh` y levanta la base de datos. Requiere PowerShell como administrador; si instala WSL2 hay que reiniciar y volver a ejecutarlo.
- Pide confirmación antes de instalar software o ejecutar comandos con permisos de administrador.

## Comandos útiles

```bash
cp .env.example .env                 # variables de entorno
bash scripts/bootstrap.sh            # genera apps/api, apps/web, apps/mobile
docker compose up -d db              # PostgreSQL + pgvector
docker compose --profile ai up -d    # Ollama (opcional)
cd apps/api && npx prisma migrate dev --name <nombre>
cd apps/api && npm run start:dev
```

## Estado actual

- Fase actual: **Fase 1 — MVP del backend** (ver `docs/roadmap.md`; 10 fases, de la 0 a la 9, tras el reajuste de foco del 25/09/2026).
- Hecho: estructura del repo, documentación, API y web generadas, Prisma 7 con migración inicial (ADR 0003), `ConfigModule` con variables validadas, `PrismaService`, configuración HTTP común (`src/app.setup.ts`: prefijo `/api`, validación global, CORS, Swagger en `/api/docs`) y `GET /api/health`. IA agnóstica al proveedor definida en el ADR 0004 (variables `LLM_*`/`EMBEDDING_*` y columnas `aiModel`/`embeddingModel` listas; el módulo `ai` se implementa en la fase 3). CI en verde con Node 24.
- Hecho también: módulo `users` (día 4, issue #3): `UsersService` exporta `create`, `findByEmail` y `findById`; los errores de dominio (`EmailAlreadyInUseError`) no son HTTP.
- Hecho también: migración a multi-organización (día 5, issue #16): `Organization`, `organizationId` en las entidades de negocio, `Category` como tabla, `TicketEvent`, `SlaPolicy`, `vector(1024)` y `EMBEDDING_*` con bge-m3. En Prisma 7, `migrate dev` no regenera el cliente: ejecutar `npx prisma generate` después. Prisma no detecta cambios en columnas `Unsupported("vector(n)")`; esos `ALTER` se escriben a mano en la migración.
- Siguiente: día 6 (issue #17): módulo `organizations` y filtrado centralizado por organización. Las piezas marcadas con ✍️ en el plan las escribe Jhon; Claude prepara la estructura, revisa y explica.
- Local: si ya hay otro PostgreSQL en el puerto 5432, usa `POSTGRES_PORT=5433` en el `.env` (y el mismo puerto en `DATABASE_URL`).
