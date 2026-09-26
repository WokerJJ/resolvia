# Plan diario de avances

Plan día a día para llevar Resolvia desde el estado actual hasta la versión **v1.0.0**. Complementa a [`roadmap.md`](roadmap.md): el roadmap dice *qué* se construye; este plan dice *cuándo* y *cómo queda en GitHub*.

- **Ritmo supuesto:** días hábiles de lunes a viernes, unas 2–3 horas por día. Se saltan los festivos de Colombia (12/10, 02/11, 16/11 y 08/12).
- **Duración:** 58 días de trabajo, del jueves 24/09/2026 al viernes 18/12/2026.
- **Alcance de la v1.0.0:** fases 1 a 5 del roadmap más el importador CSV/Excel y un `docker compose` de demostración. El resto (GLPI, extracción desde documentos y correo, empaquetado on-premise, nube y app móvil) queda para versiones siguientes; ver [Después de la v1.0.0](#después-de-la-v100).
- **Replanificado el 25/09/2026** tras el reajuste de foco (ADR 0005 a 0011). Los días 1–4 conservan su registro original.
- Si un día se atrasa, se corre el plan completo; **no se salta el cierre de fase**. Las fechas son una guía, no un contrato.

## Cómo se trabaja cada día en GitHub

1. Se parte de `develop` actualizado y se crea (o se retoma) la rama del día: `feat/<nombre>`, `fix/<nombre>`, `docs/<nombre>` o `ci/<nombre>`.
2. Se hacen **commits pequeños y convencionales en español**, como mínimo uno al día (el historial también es parte del portafolio).
3. Antes de cerrar el día en `apps/api` deben pasar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e` y `npm run build`.
4. Cuando la funcionalidad está completa se abre un **Pull Request hacia `develop`** que enlaza su issue (`Closes #N`). Se integra solo con la CI en verde. Como `Closes #N` solo cierra issues al llegar a `main`, tras el merge la issue se cierra a mano.
5. Al cerrar cada fase: se marcan las casillas de `roadmap.md`, se abre un PR `develop → main`, se crea un **tag** y un **GitHub Release** con notas y capturas.
6. Las piezas marcadas con ✍️ las escribe Jhon; Claude prepara la estructura, revisa y explica.

### Organización en GitHub (se prepara el día 3)

| Elemento | Uso |
|---|---|
| **Milestones** | Una por versión, con su fecha de cierre según este plan. |
| **Issues** | Una por cada fila de este plan que produzca un PR. Se asignan a su milestone. |
| **Labels** | `backend`, `web`, `mobile`, `ai`, `infra`, `docs`, `test`, `bug`. |
| **Project (tablero)** | Columnas *Por hacer → En curso → En revisión → Hecho*. |
| **Protección de `main`** | Exige PR y CI en verde; nada de push directo. |

### Versiones

| Tag | Contenido | Fecha objetivo |
|---|---|---|
| `v0.1.0` | Backend MVP multi-organización | lun 19/10 |
| `v0.2.0` | Web para técnicos | jue 29/10 |
| `v0.3.0` | Correo y notificaciones | jue 05/11 |
| `v0.4.0` | IA I: clasificación | vie 13/11 |
| `v0.5.0` | IA II: RAG y métricas | vie 27/11 |
| `v0.6.0` | Importador CSV/Excel | lun 07/12 |
| `v1.0.0` | Demostración completa y cierre | vie 18/12 |

---

## Fase 0 — Puesta a punto (días 1–2)

| Día | Fecha | Rama | Tareas | Commits sugeridos |
|---|---|---|---|---|
| 1 | jue 24/09 | `develop` | ✅ Entorno instalado (Git, Node, gh, Docker), repo clonado, bootstrap de `apps/api` y `apps/web`, Prisma 7 fijado, ADR 0002. Pendiente: `git config` con tu nombre y correo, `gh auth login`, commits y push de `develop`. | `chore: generar apps/api y apps/web con el bootstrap` · `fix: adaptar el schema a Prisma 7 con prisma.config.ts` · `docs: ADR 0002 Vitest y oxlint` · `ci: ejecutar pruebas e2e de la API` |
| 2 | vie 25/09 | `feat/prisma-setup` | ✅ Instalar WSL2 y reiniciar. `docker compose up -d db`. Migración `init` y comprobar que se crea la extensión `vector`. `ConfigModule` global que lee el `.env` raíz y valida las variables. `PrismaModule` / `PrismaService` con `@prisma/adapter-pg`. | `chore: migración inicial de la base de datos` · `feat: módulo de configuración con validación de variables` · `feat: PrismaService con adaptador pg` |

## Fase 1 — Backend MVP multi-organización (días 3–17) · milestone → `v0.1.0`

| Día | Fecha | Rama | Tareas | Commits sugeridos |
|---|---|---|---|---|
| 3 | lun 28/09 | `feat/api-base` | Prefijo `/api`, `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`), Swagger en `/api/docs`, CORS, endpoint `GET /api/health`. En GitHub: milestones, labels, tablero, protección de `main` e issues de la fase 1. | `feat: configuración base de la API (validación, Swagger, CORS)` · `feat: endpoint de salud` · `test: e2e del endpoint de salud` |
| 4 | mar 29/09 | `feat/users` | Módulo `users`: interfaz `UsersRepository` + `PrismaUsersRepository`, `UsersService` (crear usuario con hash bcrypt, buscar por correo). Pruebas unitarias con repositorio simulado. | `feat: módulo users con repositorio` · `test: pruebas unitarias de UsersService` |
| 5 | mié 30/09 | `feat/multi-organization` | Migración al esquema objetivo del ADR 0005: `Organization`, `organizationId` en las entidades de negocio, `Category` como tabla (reemplaza el enum), `TicketSource`, `TicketEvent`, `SlaPolicy`, `Comment.isInternal`, `AiSuggestion.promptVersion` y `vector(1024)` (ADR 0008; `importJobId` queda sin relación hasta la fase de importación). `EMBEDDING_MODEL=bge-m3` y `EMBEDDING_DIMENSIONS=1024` en `env.validation` y `.env.example`. Módulo `users` y sus pruebas con `organizationId`. Sincronizar `docs/modelo-datos.prisma`. | `feat: migración a multi-organización` · `refactor: organizationId en el módulo users` · `docs: sincronizar el modelo de datos` |
| 6 | jue 01/10 | `feat/organizations` | Módulo `organizations`. Contexto de organización por petición y extensión de Prisma que filtra por `organizationId`. Pruebas de aislamiento: una organización no ve datos de otra. ✍️ Jhon: `OrganizationsService` y sus pruebas. | `feat: módulo de organizaciones` · `feat: filtrado centralizado por organización` · `test: aislamiento entre organizaciones` |
| 7 | vie 02/10 | `feat/auth` | `POST /api/auth/register` y `POST /api/auth/login`: DTOs (contraseña con longitud máxima: bcrypt usa solo 72 bytes), JWT con `sub`, `role` y `organizationId`, errores 401/409 claros. ✍️ Jhon: `AuthService` y sus pruebas. | `feat: registro e inicio de sesión con JWT` · `test: pruebas unitarias de AuthService` |
| 8 | lun 05/10 | `feat/auth` | `JwtStrategy`, `JwtAuthGuard`, `RolesGuard` + `@Roles()`, `@CurrentUser()`, `GET /api/auth/me`. El contexto de organización se llena desde el token. e2e de registro, login y acceso por rol. | `feat: guards de autenticación y roles` · `test: e2e del flujo de autenticación` |
| 9 | mar 06/10 | `feat/seed-onprem` | Seed de desarrollo (organización, admin, técnico, usuario, categorías base y SLA por defecto). Organización inicial en modo on-premise (`DEPLOYMENT_MODE` y `DEFAULT_ORG_NAME` validadas). ADR 0012: autenticación con JWT sin estado + bcrypt. | `feat: datos semilla y organización inicial` · `docs: ADR 0012 autenticación con JWT` |
| 10 | mié 07/10 | `feat/categories` | Categorías por organización: crear, editar, activar y desactivar (solo ADMIN), nombre único por organización. ✍️ Jhon: `CategoriesService` y sus pruebas. | `feat: categorías configurables` · `test: pruebas de categorías` |
| 11 | jue 08/10 | `feat/tickets` | Módulo `tickets`: `POST /api/tickets` (`source = WEB`, evento `CREATED`), `GET /api/tickets` (USER ve los suyos; TECHNICIAN y ADMIN, todos los de su organización). | `feat: crear y listar tickets según rol` · `test: pruebas unitarias de TicketsService` |
| 12 | vie 09/10 | `feat/tickets` | `GET /api/tickets/:id` con control de acceso, filtros por estado, prioridad y categoría, paginación con DTO de consulta. | `feat: detalle, filtros y paginación de tickets` · `test: filtros de tickets` |
| 13 | mar 13/10 | `feat/tickets-workflow` | Asignación y cambio de estado, prioridad y categoría con eventos (`ASSIGNED`, `STATUS_CHANGED`, `PRIORITY_CHANGED`, `CATEGORY_CHANGED`); `closedAt` y `resolution`. ✍️ Jhon: máquina de estados (función pura) y sus pruebas. | `feat: asignación y transiciones de estado` · `test: máquina de estados de tickets` |
| 14 | mié 14/10 | `feat/comments` | Comentarios públicos e internos (el solicitante no ve los internos), evento `COMMENTED`, `firstResponseAt` con la primera respuesta pública del equipo. | `feat: comentarios públicos e internos` · `test: e2e de comentarios` |
| 15 | jue 15/10 | `feat/sla` | `SlaPolicy` por prioridad (solo ADMIN), cálculo de `dueAt` al crear el ticket o cambiar su prioridad, indicador de vencimiento. ✍️ Jhon: cálculo de `dueAt` y sus pruebas. | `feat: SLA básico por prioridad` · `test: cálculo de vencimientos` |
| 16 | vie 16/10 | `feat/errors-coverage` | Filtro global de excepciones (errores de dominio → HTTP, errores de Prisma P2002 → 409 y P2025 → 404), umbral de cobertura en la CI, e2e completo de tickets entre organizaciones. | `feat: filtro global de excepciones` · `ci: umbral de cobertura` · `test: e2e completo de tickets` |
| 17 | lun 19/10 | `docs/fase-1` | Revisar Swagger, README con la guía de ejecución, marcar el roadmap. PR `develop → main`, tag **`v0.1.0`** y Release. | `docs: guía de ejecución local` · `docs: cerrar la fase 1` |

## Fase 2 — Web para técnicos (días 18–25) · milestone → `v0.2.0`

| Día | Fecha | Rama | Tareas | Commits sugeridos |
|---|---|---|---|---|
| 18 | mar 20/10 | `feat/web-setup` | React Router, TanStack Query, cliente HTTP tipado con `VITE_API_URL`, Vitest + Testing Library. ADR 0013: librería de UI y estilos. | `chore: configurar router, consultas y pruebas en la web` · `docs: ADR 0013 librería de UI` |
| 19 | mié 21/10 | `feat/web-auth` | Login, manejo de la sesión, rutas protegidas por rol y layout. | `feat: inicio de sesión y rutas por rol` |
| 20 | jue 22/10 | `feat/web-inbox` | Bandeja de tickets con paginación y estados de carga, error y vacío. | `feat: bandeja de tickets` |
| 21 | vie 23/10 | `feat/web-inbox` | Filtros sincronizados con la URL e indicadores de SLA. ✍️ Jhon: componente de filtros y sus pruebas. | `feat: filtros de la bandeja` · `test: filtros de la bandeja` |
| 22 | lun 26/10 | `feat/web-ticket-detail` | Detalle con comentarios públicos e internos e historial (`TicketEvent`). | `feat: detalle de ticket con historial` |
| 23 | mar 27/10 | `feat/web-ticket-actions` | Crear ticket, asignar y cambiar estado, prioridad y categoría. | `feat: acciones sobre tickets en la web` |
| 24 | mié 28/10 | `feat/web-admin` | Administración de categorías y SLA; pruebas de componentes y accesibilidad básica. | `feat: administración de categorías y SLA` |
| 25 | jue 29/10 | `docs/fase-2` | Capturas en el README, roadmap. PR `develop → main`, tag **`v0.2.0`**. | `docs: cerrar la fase 2` |

## Fase 3 — Correo y notificaciones (días 26–29) · milestone → `v0.3.0`

| Día | Fecha | Rama | Tareas | Commits sugeridos |
|---|---|---|---|---|
| 26 | vie 30/10 | `feat/jobs` | pg-boss (ADR 0007): módulo `jobs`, worker con su propio punto de entrada y un helper para ejecutar trabajos en las pruebas. | `feat: cola de trabajos con pg-boss` · `test: ejecución de trabajos en pruebas` |
| 27 | mar 03/11 | `feat/email-intake` | Lectura periódica del buzón por IMAP (variables `IMAP_*` validadas): un correo nuevo crea un ticket (`source = EMAIL`) y una respuesta se agrega como comentario. ✍️ Jhon: función que reconoce el ticket al que responde un correo y sus pruebas. | `feat: ingreso de tickets por correo` · `test: asociación de respuestas a tickets` |
| 28 | mié 04/11 | `feat/notifications` | Notificaciones por correo en cola: al solicitante (creado, respuesta pública, resuelto) y al técnico (asignado). | `feat: notificaciones por correo` |
| 29 | jue 05/11 | `docs/fase-3` | Servidor de correo de prueba en el compose de desarrollo, e2e del flujo de correo. Tag **`v0.3.0`**. | `test: e2e del flujo de correo` · `docs: cerrar la fase 3` |

## Fase 4 — IA I: clasificación (días 30–35) · milestone → `v0.4.0`

| Día | Fecha | Rama | Tareas | Commits sugeridos |
|---|---|---|---|---|
| 30 | vie 06/11 | `feat/ai-providers` | Módulo `ai` con los proveedores como transporte (ADR 0006): `ChatProvider`, `EmbeddingProvider`, proveedores simulados y `OpenAICompatibleProvider`. | `feat: proveedores de IA como transporte` · `test: proveedores simulados` |
| 31 | lun 09/11 | `feat/ai-providers` | `AnthropicProvider` con el SDK oficial, selección por `LLM_PROVIDER`, pruebas con clientes simulados. | `feat: adaptador de Anthropic` |
| 32 | mar 10/11 | `feat/ai-classifier` | `TicketClassifierService`: prompt versionado con las categorías de la organización, contenido delimitado (ADR 0010), esquema zod, un reintento y "sin clasificar". Casos de *prompt injection*. ✍️ Jhon: esquema zod y pruebas del clasificador. | `feat: clasificador de tickets` · `test: validación y prompt injection` |
| 33 | mié 11/11 | `feat/ai-classify-job` | Trabajo de clasificación al crear un ticket: guarda categoría, prioridad y modelo sugeridos y registra `AI_CLASSIFIED`. En la web, estado "pendiente" y aceptar o corregir. | `feat: clasificación asíncrona` · `feat: aceptar o corregir la clasificación en la web` |
| 34 | jue 12/11 | `feat/ai-evaluation` | Script de evaluación contra el conjunto de la fase 0 (o uno de ejemplo si aún no existe): precisión por modelo y versión de prompt. Resultados en `docs/evaluacion-ia.md`. | `feat: evaluación de la clasificación` · `docs: resultados de la evaluación` |
| 35 | vie 13/11 | `docs/fase-4` | Roadmap, capturas. Tag **`v0.4.0`**. | `docs: cerrar la fase 4` |

## Fase 5 — IA II: RAG y métricas (días 36–44) · milestone → `v0.5.0`

| Día | Fecha | Rama | Tareas | Commits sugeridos |
|---|---|---|---|---|
| 36 | mar 17/11 | `feat/knowledge-upload` | Base de conocimiento: `StorageService` local, carga de PDF/Word (solo ADMIN), extracción de texto. | `feat: carga de documentos` |
| 37 | mié 18/11 | `feat/knowledge-chunking` | División en fragmentos con solapamiento. ✍️ Jhon: chunker (función pura) y sus pruebas. | `feat: división de documentos en fragmentos` · `test: pruebas del chunker` |
| 38 | jue 19/11 | `feat/embeddings` | Trabajo de embeddings con bge-m3 para documentos y tickets resueltos, validación de dimensiones, índices HNSW (SQL manual en la migración) y comando de reindexación. | `feat: embeddings en segundo plano` · `feat: comando de reindexación` |
| 39 | vie 20/11 | `feat/vector-search` | Búsqueda por similitud por organización y modelo; `GET /api/tickets/:id/similar` con tickets resueltos parecidos. | `feat: búsqueda vectorial` · `feat: tickets similares` |
| 40 | lun 23/11 | `feat/ai-suggestions` | `SuggestionService`: RAG sobre documentos y tickets resueltos, fuentes citadas, `promptVersion`, contenido delimitado; en cola. | `feat: sugerencias de respuesta con RAG` |
| 41 | mar 24/11 | `feat/ai-feedback` | Valoración útil / no útil; en la web, panel de sugerencia con fuentes y tickets similares. | `feat: valoración y panel de sugerencias` |
| 42 | mié 25/11 | `feat/web-knowledge` | Administración de la base de conocimiento: subir, listar y ver el estado de procesamiento. | `feat: administración de la base de conocimiento` |
| 43 | jue 26/11 | `feat/metrics` | Módulo `metrics` y tablero: volumen por categoría, cumplimiento de SLA, precisión de la IA y utilidad de las sugerencias. | `feat: tablero de métricas` |
| 44 | vie 27/11 | `docs/fase-5` | GIF de la demo, roadmap. Tag **`v0.5.0`**. | `docs: cerrar la fase 5` |

## Importador CSV/Excel (días 45–50) · milestone → `v0.6.0`

Primera parte de la fase 6 del roadmap (ADR 0009).

| Día | Fecha | Rama | Tareas | Commits sugeridos |
|---|---|---|---|---|
| 45 | lun 30/11 | `feat/imports-model` | Migración de `ImportJob`, `ImportRecord` e `ImportMappingTemplate`; relación `Ticket.importJobId`. Módulo `imports` con `ImportAdapter` y `NormalizedTicket`. | `feat: modelo de importaciones con staging` |
| 46 | mar 01/12 | `feat/import-csv` | Adaptador CSV/Excel: extracción a staging con `contentHash`. ✍️ Jhon: `CsvImportAdapter` y sus pruebas. | `feat: adaptador de importación CSV/Excel` · `test: extracción de CSV` |
| 47 | mié 02/12 | `feat/import-mapping` | Mapeo de columnas, categorías, prioridades, estados y usuarios; plantillas de mapeo reutilizables. | `feat: mapeo configurable de importaciones` |
| 48 | jue 03/12 | `feat/import-run` | Importar los registros aceptados en cola (tickets `IMPORT`, comentarios, eventos `IMPORTED`), idempotencia y reindexación de embeddings. | `feat: importación idempotente` |
| 49 | vie 04/12 | `feat/web-import` | Asistente en la web: subir archivo, mapear, revisar el staging e importar. | `feat: asistente de importación en la web` |
| 50 | lun 07/12 | `docs/importacion` | CSV de ejemplo con historial ficticio, e2e del flujo completo. Tag **`v0.6.0`**. | `test: e2e de importación` · `docs: guía de importación` |

## Cierre de la v1.0.0 (días 51–58) · milestone → `v1.0.0`

| Día | Fecha | Rama | Tareas | Commits sugeridos |
|---|---|---|---|---|
| 51 | mié 09/12 | `chore/docker-images` | Imágenes Docker de la API, el worker y la web. | `chore: imágenes Docker` |
| 52 | jue 10/12 | `chore/demo-compose` | `docker compose` de demostración con todo el stack y datos de ejemplo (no es aún el paquete on-premise de la fase 7). | `chore: entorno de demostración` |
| 53 | vie 11/12 | — | Día de margen para ponerse al día. | — |
| 54 | lun 14/12 | `fix/revision-seguridad` | Revisión del ADR 0010 y del aislamiento entre organizaciones, `npm audit`, revisión de licencias. | `fix: correcciones de la revisión de seguridad` |
| 55 | mar 15/12 | `fix/pulido` | Corrección de errores pendientes y limpieza de issues abiertas. | `fix: correcciones finales` |
| 56 | mié 16/12 | `docs/readme-final` | README final: diagrama, capturas, GIF y enlaces a los ADR. | `docs: README final` |
| 57 | jue 17/12 | `docs/demo` | Video corto de la demo y guía de uso. | `docs: guía de uso y demo` |
| 58 | vie 18/12 | `main` | `docs/retrospectiva.md`, PR `develop → main`, tag **`v1.0.0`** y Release final. | `docs: retrospectiva del proyecto` |

## Después de la v1.0.0

Sin fechas todavía; se planifican según lo que muestre la fase de validación:

- **Fase 0 — Validación:** corre en paralelo desde ya (entrevistas, conjunto de evaluación, precio tentativo).
- **Fase 6 — Resto de la importación:** adaptador de GLPI, extracción asistida por IA desde documentos y correo, arranque en frío.
- **Fase 7 — Empaquetado on-premise:** instalador, respaldos, actualización sin internet y guía de hardware.
- **Fase 8 — Nube multi-organización en AWS:** coincide con el curso de AWS.
- **Fase 9 — App móvil Flutter** y evaluación de WhatsApp como canal.

---

## Registro de avance

Al final de cada día, anota una línea aquí (o en el tablero de GitHub). Sirve para ajustar el plan y para contar el proceso en entrevistas.

| Día | Fecha real | Hecho | Pendiente / bloqueos |
|---|---|---|---|
| 1 | 24/09 | Entorno instalado, bootstrap, Prisma 7, ADR 0002, plan diario, e2e en la CI, commits en `develop` | `gh auth login`, push de `develop`, WSL2 |
| 2 | 24/09 | Adelantado: WSL2 y Docker, migración `init` con pgvector, `ConfigModule` validado, `PrismaService` con `PrismaPg`, generador ESM `prisma-client` (ADR 0003), `typecheck` en la CI. PostgreSQL local en el 5432 → contenedor en el 5433. | PR `feat/prisma-setup` → `develop` |
| 3 | 24/09 | Adelantado (código): `configureApp` compartido por `main.ts` y las e2e, `ValidationPipe` global, Swagger en `/api/docs`, CORS con `CORS_ORIGINS` validado, `GET /api/health` (503 si la base de datos no responde). | — (organización en GitHub hecha el 24/09: tablero público, 6 milestones, 8 labels, issues #3–#12 y `main` protegida) |
| — | 25/09 | Fuera del plan: ADR 0004 (proveedores de chat y embeddings intercambiables, reemplaza al 0001), variables `LLM_*` y `EMBEDDING_*`, columnas `aiModel` y `embeddingModel`, roadmap y plan ajustados, sección de mejoras futuras. | Día 4 (`UsersService` lo escribe Jhon) |
| 4 | 25/09 | Módulo `users`: `UsersRepository` + `PrismaUsersRepository` sin exponer `passwordHash` y con `EmailAlreadyInUseError` ante el índice único; `UsersService` y sus 9 pruebas **escritos por Jhon** (bcrypt, correo normalizado); prueba de integración del repositorio. | Día 5: DTO de registro con longitud máxima de contraseña (bcrypt usa solo 72 bytes) |
| — | 25/09 | Reajuste de foco: IA privada para soporte TI, multi-organización, importación multifuente y licencia AGPL-3.0 (ADR 0005 a 0011); roadmap de 10 fases; plan replanificado desde el día 5. | Día 5: migración a multi-organización |
| 5 | 26/09 | Migración `multi_organization`: `Organization`, `organizationId` en User, Ticket, Category, KnowledgeDocument y SlaPolicy; `Category` como tabla; `TicketSource`, `TicketEvent`, `SlaPolicy`, `Comment.isInternal`, `AiSuggestion.promptVersion`; `vector(1024)` con `ALTER` manual en `DocumentChunk` (Prisma no detecta cambios en columnas `Unsupported`). `EMBEDDING_*` con bge-m3. Módulo `users` con `organizationId`. | Día 6: organizaciones y filtrado centralizado |
| 6 (parcial) | 26/09 | Módulo `organizations`: repositorio con `OrganizationSlugInUseError` y prueba de integración; `OrganizationsService` y `slugify` con 15 pruebas (**escritos por Claude a pedido de Jhon**, en lugar de la pieza ✍️). | Contexto de organización por petición, extensión de Prisma que filtra por `organizationId` y pruebas de aislamiento |
| 6 | 26/09 | Completado: `OrganizationContext` (AsyncLocalStorage, un contexto por petición) y extensión de Prisma `organizationScope` que filtra User, Ticket, Category, KnowledgeDocument y SlaPolicy, con denegación por defecto y `runAsSystem` para lo global. Hallazgo: las consultas de Prisma son perezosas y se ejecutaban fuera del contexto si se esperaban afuera; `OrganizationContext` las espera dentro. Pruebas de aislamiento contra PostgreSQL. | Día 7: registro e inicio de sesión con JWT |
