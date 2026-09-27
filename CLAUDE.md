# CLAUDE.md — Resolvia

Contexto para Claude Code. Léelo antes de cualquier tarea en este repositorio. Si existe `.claude/agentes/contexto.md` (memoria local de los agentes de revisión, no versionada), léelo también para retomar el trabajo.

## Qué es Resolvia

Helpdesk con **IA privada para soporte TI que aprende de cómo resuelve problemas el equipo**: los usuarios crean tickets (web, correo, móvil), la IA los clasifica y sugiere respuestas al técnico con RAG sobre documentos y tickets resueltos. El modelo puede correr dentro de la institución. Funciona on-premise (una organización) o en la nube (varias), e importa el historial desde CSV/Excel, GLPI, documentos y correo. Mercado inicial: instituciones educativas y pymes. La IA sugiere, la persona decide. Licencia AGPL-3.0 con opción comercial (ADR 0011).

Es un proyecto de portafolio de Jhon Hucker Chalarca Ramírez (GitHub: WokerJJ), estudiante de Tecnología en Gestión de Sistemas Informáticos en UNINTEP. Se mostrará a profesores y reclutadores, así que la calidad del código, las pruebas, la documentación y el historial de commits importan tanto como las funcionalidades. Jhon quiere **aprender mientras construye**: explica el porqué de las decisiones importantes. Conversación en español.

Repositorio: https://github.com/WokerJJ/resolvia

## Stack

| Capa | Tecnología |
|---|---|
| Backend (`apps/api`) | NestJS 12 (ESM), TypeScript estricto, Prisma 7.10 con adaptador `pg` (ADR 0003), Node 24 (`.nvmrc`) |
| Base de datos | PostgreSQL 16 + pgvector (Docker) |
| Web (`apps/web`) | React + TypeScript + Vite (solo el scaffold; fase 2) |
| Móvil (`apps/mobile`) | Flutter (fase 9; aún no generado) |
| IA | Proveedores como transporte (ADR 0004 y 0006): `ChatProvider.complete()` y `EmbeddingProvider.embed()`; adaptadores `OpenAICompatibleProvider` (OpenAI, Azure, Gemini, vLLM, Ollama…) y `AnthropicProvider`; prompts y validación zod en servicios del dominio; embeddings bge-m3 de 1024 dimensiones (ADR 0008). El módulo `ai` se implementa en la fase 4. |
| Tareas en segundo plano | pg-boss sobre la misma PostgreSQL (ADR 0007), desde la fase 3 |
| Pruebas | Vitest (unitarias y e2e) + Supertest; lint con oxlint (ADR 0002) |
| CI | GitHub Actions (`.github/workflows/ci.yml`): lint, tipos, migraciones, pruebas, e2e y build contra pgvector |
| Nube (fase 8) | AWS: RDS, S3, EC2 o ECS |

## Documentación

- `docs/arquitectura.md` — módulos (✅ implementado / ⏳ planeado), worker, flujo de tickets, RAG e importación
- `docs/modelo-datos.prisma` — **copia exacta** de `apps/api/prisma/schema.prisma`; se actualiza cada vez que cambia el schema
- `docs/roadmap.md` — fases 0 a 9 con casillas; **márcalas al completarlas**
- `docs/plan-diario.md` — plan día a día hasta la v1.0.0 (18/12/2026), con ramas, commits sugeridos, piezas ✍️ para Jhon y el **registro de avance**, que se actualiza cada día
- `docs/decisiones/` — ADR 0001 a 0011. El 0012 está reservado para documentar la autenticación JWT ya implementada en los días 7 y 8 (se escribe en el día 9) y el 0013 para la librería de UI (día 18); el siguiente libre es el 0014

## Convenciones de código

- Arquitectura por módulos NestJS: `organizations`, `auth`, `users`, `categories`, `tickets`, `jobs`, `email-intake`, `ai`, `knowledge`, `metrics`, `imports` (ver `docs/arquitectura.md`).
- Separación **Controller → Service → Repository**. Los servicios no importan Prisma: dependen de repositorios definidos como **clases abstractas** (tokens de inyección) e implementados con Prisma. Los servicios lanzan **errores de dominio**, no errores HTTP.
- **Multi-organización (ADR 0005):** toda entidad de negocio lleva `organizationId` y el filtro lo aplica la extensión de Prisma `organizationScope` (`src/prisma/organization-scope.ts`), nunca a mano. Deniega por defecto: sin organización en `OrganizationContext` la consulta falla. Lo global (login por correo, seeds, trabajos del sistema) se ejecuta con `OrganizationContext.runAsSystem`. Los modelos hijos (Comment, TicketEvent, AiSuggestion, DocumentChunk) se alcanzan siempre a través de su padre. Al crear, se pasa `organizationId` explícito: los tipos lo exigen y la extensión verifica que coincida.
- **Autenticación cerrada por defecto:** `JwtAuthGuard` y `RolesGuard` son globales. Todo endpoint exige token salvo los marcados con `@Public()`; `@Roles(...)` restringe por rol y `@CurrentUser()` entrega el usuario del token. El guard llena `OrganizationContext` con el `organizationId` del token.
- Validación de entrada con DTOs y `class-validator` (`whitelist` + `forbidNonWhitelisted`: un campo no declarado da 400). Documentar endpoints con decoradores de Swagger.
- Nada lento dentro de la petición: lo que depende del modelo o de servicios externos va a la cola (ADR 0007).
- El texto de los tickets, correos e importaciones es dato no confiable: se envía al modelo delimitado y toda salida se valida con zod (ADR 0010). El dominio nunca depende de un proveedor de IA concreto; nada de ramas de código por proveedor.
- Código, nombres y mensajes de API en inglés; documentación (`docs/`, README) en español. Sin `any` salvo justificación en comentario.

## Pruebas

- Toda funcionalidad nueva lleva pruebas: unitarias para servicios (`*.spec.ts` junto al código, `npm test`) y e2e o de integración para endpoints y repositorios (`apps/api/test/*.e2e-spec.ts`, `npm run test:e2e`, contra la base de datos real).
- Mocks con la API de Vitest (`vi.fn()`, `vi.spyOn()`). Las pruebas nunca llaman a un modelo real: usan `FakeChatProvider` y `FakeEmbeddingProvider`.
- Las e2e usan `test/utils/create-test-app.ts` (aplica `configureApp` igual que `main.ts`; acepta providers sustitutos y controladores de prueba). Cada prueba crea sus datos con un prefijo único y los borra al terminar (con `runAsSystem` para modelos con organización).
- Antes de dar una tarea por terminada deben pasar en `apps/api`: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e` y `npm run build`.

## Git y flujo de trabajo

- `main` protegida (solo por PR, con los dos checks de la CI en verde) y `develop` para el trabajo diario. Un día del plan = una issue = una rama `feat/<nombre>` desde `develop` = un PR con `Closes #N`, integrado con **merge commit** (no squash).
- `Closes #N` no cierra issues en PRs hacia `develop`: tras el merge se cierra a mano y la tarjeta del tablero pasa a "Hecho".
- Commits convencionales en español (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`, `ci:`), pequeños, reales y con un solo propósito. Nunca fechas falsas ni `.env` o secretos.
- **Pregunta antes de hacer push, abrir un PR o hacer merge.**
- Antes del push, flujo de revisión con los agentes de usuario (ver `~/.claude/CLAUDE.md`): `evaluador-codigo` y `buscador-fallas` en paralelo, Jhon aprueba qué corregir, `corrector-codigo` corrige y `cronista-proyecto` actualiza `.claude/agentes/`.

## Entorno local (Windows)

- En PowerShell usa `npm.cmd` en lugar de `npm` (la política de ejecución bloquea `npm.ps1`). `gh` está en `C:/Program Files/GitHub CLI/gh.exe`.
- Hay un PostgreSQL 17 nativo en el puerto 5432, así que el contenedor usa `POSTGRES_PORT=5433` en el `.env` (y ese puerto en `DATABASE_URL`).
- Si la base de datos no responde, probablemente Docker Desktop está cerrado.
- Pide confirmación antes de instalar software o ejecutar comandos con permisos de administrador.

## Comandos útiles

```bash
docker compose up -d db                     # PostgreSQL + pgvector (desde la raíz)
docker compose --profile ai up -d           # Ollama (opcional)
cd apps/api && npm run start:dev            # API en http://localhost:3000/api (Swagger en /api/docs)
cd apps/api && npx prisma migrate dev --name <nombre>
cd apps/api && npx prisma generate          # obligatorio después de migrar (ver trampas)
```

`scripts/bootstrap.sh` solo sirvió para generar las apps al inicio; no lo vuelvas a ejecutar sobre `apps/api` ni `apps/web`.

## Trampas conocidas

- **Prisma 7:** `migrate dev` no regenera el cliente; ejecuta `npx prisma generate` después.
- **Prisma y pgvector:** Prisma no detecta cambios en columnas `Unsupported("vector(n)")`. Esos `ALTER` se escriben a mano en la migración, y conviene revisar el SQL generado antes de aplicarlo.
- **Consultas perezosas:** una consulta de Prisma se ejecuta al hacer `await`, no al llamarla. `OrganizationContext` espera las promesas dentro del contexto; no devuelvas consultas sin esperar fuera de él.
- **npm 11 / Node 24:** el lock se genera con npm 11. Con Node 20 (npm 10), `npm ci` falla por diferencias en las *peer dependencies*.
- **Prettier** reformatea `apps/api/src/users/users.module.ts` (solo formato); no lo mezcles en commits de otro tema.

## Estado actual

- **Fase 1 — MVP del backend** (v0.1.0 prevista para el 19/10/2026). Días 1–7 integrados en `develop`; el día 8 está en la rama `feat/auth-guards`, pendiente de revisión y push.
- **Qué funciona:**
  - Configuración validada al arrancar.
  - `GET /api/health`.
  - Registro por `organizationSlug` e inicio de sesión con JWT (`sub`, `organizationId`, `role`).
  - `GET /api/auth/me` y guards globales por rol.
  - Organizaciones y aislamiento por organización en cada consulta.
  - Esquema multi-organización (categorías como tabla, historial, SLA, `vector(1024)`).
- **Siguiente:** día 9 (issue #6): datos semilla, organización inicial on-premise (`DEPLOYMENT_MODE`, `DEFAULT_ORG_NAME`) y ADR 0012. Después, el día 10 (issue #18): categorías configurables.
- El detalle día a día está en el registro de `docs/plan-diario.md`.
