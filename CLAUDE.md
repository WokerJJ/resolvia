# CLAUDE.md — Resolvia

Contexto para Claude Code. Léelo antes de cualquier tarea en este repositorio.

## Qué es Resolvia

Mesa de ayuda inteligente: los usuarios crean tickets de soporte TI, la IA los clasifica (categoría y prioridad) y sugiere respuestas al técnico usando RAG sobre la base de conocimiento de la organización (PDFs de manuales y procedimientos). La IA sugiere, la persona decide.

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
| IA | Interfaz `LLMProvider` con `OllamaProvider` (local) y `AnthropicProvider` (API); embeddings siempre con Ollama `nomic-embed-text` (768 dims) |
| Pruebas | Vitest (unitarias y e2e) + Supertest (e2e); lint con oxlint (ver ADR 0002) |
| CI/CD | GitHub Actions (`.github/workflows/ci.yml`) |
| Nube (fase 5) | AWS: RDS, S3, EC2 o ECS |

## Documentación existente

- `docs/arquitectura.md` — módulos del backend, flujo de tickets y flujo RAG
- `docs/modelo-datos.prisma` — modelo de datos inicial (se copia a `apps/api/prisma/schema.prisma`)
- `docs/roadmap.md` — fases y tareas con casillas; **márcalas al completarlas**
- `docs/plan-diario.md` — plan día a día con ramas y commits sugeridos; consúltalo para saber qué toca hoy y anota el avance en su registro
- `docs/decisiones/` — ADRs; crea uno nuevo (`0002-...`) ante cada decisión de arquitectura relevante

## Convenciones de código

- Arquitectura por módulos NestJS: `auth`, `users`, `tickets`, `ai`, `knowledge`, `metrics`.
- Separación **Controller → Service → Repository**. Los servicios no importan Prisma directamente; usan repositorios inyectados. Esto permite probar la lógica con mocks.
- Validación de entrada con DTOs y `class-validator`; nunca confiar en el body sin validar.
- Documentar endpoints con decoradores de Swagger.
- El dominio nunca depende de un proveedor de IA concreto: solo de la interfaz `LLMProvider`.
- Código, nombres de variables y mensajes de API en inglés; documentación (`docs/`, README) en español.
- Sin `any` salvo justificación en comentario.

## Pruebas

- Toda funcionalidad nueva lleva pruebas: unitarias para servicios, e2e para endpoints.
- Unitarias en `*.spec.ts` junto al código (`npm test`); e2e en `apps/api/test/*.e2e-spec.ts` (`npm run test:e2e`).
- Mocks con la API de Vitest (`vi.fn()`, `vi.spyOn()`), no la de Jest.
- Las pruebas nunca llaman a un LLM real: usan un `LLMProvider` simulado.
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

- Fase actual: **Fase 1 — MVP del backend** (ver `docs/roadmap.md`).
- Hecho: estructura del repo, documentación, API y web generadas, Prisma 7 con migración inicial (ADR 0003), `ConfigModule` con variables validadas y `PrismaService`, CI en verde con Node 24.
- Siguiente: día 3 de `docs/plan-diario.md` (configuración base de la API: validación global, Swagger, CORS y endpoint de salud).
- Local: si ya hay otro PostgreSQL en el puerto 5432, usa `POSTGRES_PORT=5433` en el `.env` (y el mismo puerto en `DATABASE_URL`).
