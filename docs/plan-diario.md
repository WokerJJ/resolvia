# Plan diario de avances

Plan día a día para llevar Resolvia desde el estado actual hasta la versión **v1.0.0**. Complementa a [`roadmap.md`](roadmap.md): el roadmap dice *qué* se construye; este plan dice *cuándo* y *cómo queda en GitHub*.

- **Ritmo supuesto:** días hábiles de lunes a viernes, unas 2–3 horas por día. Se saltan los festivos de Colombia (12/10, 02/11, 16/11 y 08/12).
- **Duración:** 58 días de trabajo, del jueves 24/09/2026 al viernes 18/12/2026.
- **Orden:** la app móvil (Flutter) pasa a ser la **última fase**, después de la nube.
- Si un día se atrasa, se corre el plan completo; **no se salta el cierre de fase**. Las fechas son una guía, no un contrato.

## Cómo se trabaja cada día en GitHub

1. Se parte de `develop` actualizado y se crea (o se retoma) la rama del día: `feat/<nombre>`, `fix/<nombre>`, `docs/<nombre>` o `ci/<nombre>`.
2. Se hacen **commits pequeños y convencionales en español**, como mínimo uno al día (el historial también es parte del portafolio).
3. Antes de cerrar el día en `apps/api` deben pasar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e` y `npm run build`.
4. Cuando la funcionalidad está completa se abre un **Pull Request hacia `develop`** que enlaza su issue (`Closes #N`). Se integra solo con la CI en verde.
5. Al cerrar cada fase: se marcan las casillas de `roadmap.md`, se abre un PR `develop → main`, se crea un **tag** y un **GitHub Release** con notas y capturas.

### Organización en GitHub (se prepara el día 3)

| Elemento | Uso |
|---|---|
| **Milestones** | Una por fase: `Fase 1 — Backend MVP`, `Fase 2 — Web`, … Cada una tiene su fecha de cierre según este plan. |
| **Issues** | Una por cada fila de este plan que produzca un PR. Se asignan a su milestone. |
| **Labels** | `backend`, `web`, `mobile`, `ai`, `infra`, `docs`, `test`, `bug`. |
| **Project (tablero)** | Columnas *Por hacer → En curso → En revisión → Hecho*. |
| **Protección de `main`** | Exige PR y CI en verde; nada de push directo. |

### Versiones

| Tag | Fase | Fecha objetivo |
|---|---|---|
| `v0.1.0` | Backend MVP | mar 13/10 |
| `v0.2.0` | Frontend web | lun 26/10 |
| `v0.3.0` | IA I: clasificación | mar 03/11 |
| `v0.4.0` | IA II: RAG | jue 19/11 |
| `v0.5.0` | Métricas y nube | jue 03/12 |
| `v1.0.0` | App móvil y cierre | vie 18/12 |

---

## Fase 0 — Puesta a punto (días 1–2)

| Día | Fecha | Rama | Tareas | Commits sugeridos |
|---|---|---|---|---|
| 1 | jue 24/09 | `develop` | ✅ Entorno instalado (Git, Node, gh, Docker), repo clonado, bootstrap de `apps/api` y `apps/web`, Prisma 7 fijado, ADR 0002. Pendiente: `git config` con tu nombre y correo, `gh auth login`, commits y push de `develop`. | `chore: generar apps/api y apps/web con el bootstrap` · `fix: adaptar el schema a Prisma 7 con prisma.config.ts` · `docs: ADR 0002 Vitest y oxlint` · `ci: ejecutar pruebas e2e de la API` |
| 2 | vie 25/09 | `feat/prisma-setup` | ✅ Instalar WSL2 y reiniciar. `docker compose up -d db`. Migración `init` y comprobar que se crea la extensión `vector`. `ConfigModule` global que lee el `.env` raíz y valida las variables. `PrismaModule` / `PrismaService` con `@prisma/adapter-pg`. | `chore: migración inicial de la base de datos` · `feat: módulo de configuración con validación de variables` · `feat: PrismaService con adaptador pg` |

## Fase 1 — Backend MVP (días 3–13) · milestone → `v0.1.0`

| Día | Fecha | Rama | Tareas | Commits sugeridos |
|---|---|---|---|---|
| 3 | lun 28/09 | `feat/api-base` | Prefijo `/api`, `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`), Swagger en `/api/docs`, CORS, endpoint `GET /api/health`. En GitHub: milestones, labels, tablero, protección de `main` e issues de la fase 1. | `feat: configuración base de la API (validación, Swagger, CORS)` · `feat: endpoint de salud` · `test: e2e del endpoint de salud` |
| 4 | mar 29/09 | `feat/users` | Módulo `users`: interfaz `UsersRepository` + `PrismaUsersRepository`, `UsersService` (crear usuario con hash bcrypt, buscar por correo). Pruebas unitarias con repositorio simulado. | `feat: módulo users con repositorio` · `test: pruebas unitarias de UsersService` |
| 5 | mié 30/09 | `feat/auth` | `POST /auth/register` y `POST /auth/login`: DTOs, `AuthService`, emisión de JWT, errores 401/409 claros. Pruebas unitarias. | `feat: registro e inicio de sesión con JWT` · `test: pruebas unitarias de AuthService` |
| 6 | jue 01/10 | `feat/auth` | `JwtStrategy`, `JwtAuthGuard`, `RolesGuard` + decorador `@Roles()`, decorador `@CurrentUser()`, `GET /auth/me`. e2e de registro, login y acceso por rol. PR → `develop`. | `feat: guards de autenticación y roles` · `test: e2e del flujo de autenticación` |
| 7 | vie 02/10 | `feat/seed` | Script `prisma db seed` (admin, técnico y usuario de prueba). ADR 0005: autenticación con JWT sin estado + bcrypt (por qué y límites, por ejemplo la revocación). Día de margen para ponerse al día. | `feat: datos semilla para desarrollo` · `docs: ADR 0005 autenticación con JWT` |
| 8 | lun 05/10 | `feat/tickets` | Módulo `tickets`: repositorio, `POST /tickets` (el usuario crea el suyo), `GET /tickets` (USER ve los suyos; TECHNICIAN y ADMIN ven todos). Pruebas unitarias. | `feat: crear y listar tickets según rol` · `test: pruebas unitarias de TicketsService` |
| 9 | mar 06/10 | `feat/tickets` | `GET /tickets/:id` con control de acceso, filtros por estado, prioridad y categoría, paginación (`page`, `limit`) con DTO de consulta. | `feat: detalle, filtros y paginación de tickets` · `test: filtros de tickets` |
| 10 | mié 07/10 | `feat/tickets-workflow` | Asignación (ADMIN asigna a un TECHNICIAN). Cambio de estado con **transiciones válidas** (máquina de estados como función pura, fácil de probar). | `feat: asignación de tickets` · `feat: transiciones de estado validadas` · `test: máquina de estados de tickets` |
| 11 | jue 08/10 | `feat/comments` | Comentarios: `POST/GET /tickets/:id/comments` con permisos. Pruebas unitarias y e2e. | `feat: comentarios en tickets` · `test: e2e de comentarios` |
| 12 | vie 09/10 | `feat/errors-coverage` | Filtro global de excepciones con formato de error uniforme, errores de Prisma traducidos (P2002 → 409, P2025 → 404). Umbral de cobertura en Vitest y reporte en la CI. e2e completo de tickets. | `feat: filtro global de excepciones` · `test: e2e completo de tickets` · `ci: umbral de cobertura` |
| 13 | mar 13/10 | `docs/fase-1` | Revisar Swagger (ejemplos y respuestas), README con "cómo correr el proyecto", marcar el roadmap. PR `develop → main`, tag **`v0.1.0`** y Release con captura de Swagger. | `docs: guía de ejecución local` · `docs: cerrar fase 1 en el roadmap` |

## Fase 2 — Frontend web (días 14–22) · milestone → `v0.2.0`

| Día | Fecha | Rama | Tareas | Commits sugeridos |
|---|---|---|---|---|
| 14 | mié 14/10 | `feat/web-setup` | React Router, TanStack Query, cliente HTTP tipado con `VITE_API_URL`, Vitest + Testing Library. ADR 0006: librería de UI y estilos (por ejemplo Tailwind + shadcn/ui). El job `web` de la CI empieza a ejecutarse. | `chore: configurar router, consultas y pruebas en la web` · `docs: ADR 0006 librería de UI` |
| 15 | jue 15/10 | `feat/web-auth` | Página de login, contexto de sesión, manejo del token y cierre de sesión. | `feat: inicio de sesión en la web` · `test: formulario de login` |
| 16 | vie 16/10 | `feat/web-auth` | Rutas protegidas por rol, layout (barra lateral y encabezado), página 404. | `feat: rutas protegidas por rol y layout` |
| 17 | lun 19/10 | `feat/web-inbox` | Bandeja de tickets: tabla con paginación, estados de carga, error y vacío. | `feat: bandeja de tickets` |
| 18 | mar 20/10 | `feat/web-inbox` | Filtros por estado, prioridad y categoría sincronizados con la URL (se pueden compartir y recargar). | `feat: filtros de la bandeja en la URL` · `test: filtros de la bandeja` |
| 19 | mié 21/10 | `feat/web-ticket-detail` | Vista de detalle con historial de comentarios y formulario para comentar. | `feat: detalle de ticket con comentarios` |
| 20 | jue 22/10 | `feat/web-ticket-actions` | Crear ticket (formulario validado con react-hook-form + zod), asignar y cambiar estado según rol. | `feat: crear, asignar y cambiar estado de tickets` |
| 21 | vie 23/10 | `test/web` | Pruebas de componentes clave, accesibilidad básica (labels, foco), diseño responsive. | `test: componentes de la bandeja y el detalle` · `fix: ajustes de accesibilidad` |
| 22 | lun 26/10 | `docs/fase-2` | Capturas en el README, roadmap marcado. PR `develop → main`, tag **`v0.2.0`**. | `docs: capturas de la web y cierre de fase 2` |

## Fase 3 — IA I: clasificación (días 23–27) · milestone → `v0.3.0`

| Día | Fecha | Rama | Tareas | Commits sugeridos |
|---|---|---|---|---|
| 23 | mar 27/10 | `feat/ai-providers` | `docker compose --profile ai up -d`, descargar `llama3.2:3b` y `nomic-embed-text`. Módulo `ai`: interfaces `ChatProvider` y `EmbeddingProvider` (ADR 0004), elección por `LLM_PROVIDER`, `FakeChatProvider` y `FakeEmbeddingProvider` para pruebas. | `feat: interfaces de proveedores de chat y embeddings` · `test: proveedores simulados` |
| 24 | mié 28/10 | `feat/ai-adapters` | `OpenAICompatibleProvider` (chat y embeddings; con Ollama local a través de `/v1`) y `AnthropicProvider` con el SDK oficial. Clasificación: prompt, JSON validado con zod, un reintento indicando el error y, si vuelve a fallar, ticket sin clasificar. Pruebas con clientes HTTP simulados. | `feat: adaptadores compatible con OpenAI y de Anthropic` · `test: validación y reintento de la clasificación` |
| 25 | jue 29/10 | `feat/ai-classify-ticket` | Clasificar al crear un ticket **sin bloquear la creación** (evento asíncrono) y guardar en el ticket la categoría, prioridad, confianza y modelo (`aiModel`). ADR 0007: clasificación síncrona o asíncrona. | `feat: clasificación automática al crear un ticket` · `docs: ADR 0007 clasificación asíncrona` |
| 26 | vie 30/10 | `feat/web-ai-classification` | En la web, mostrar la sugerencia de la IA con su confianza; el técnico la acepta o la corrige (*la IA sugiere, la persona decide*). | `feat: aceptar o corregir la clasificación de la IA` |
| 27 | mar 03/11 | `docs/evaluacion-ia` | Conjunto de ~30 tickets de ejemplo y script que compara la precisión de varios modelos (por ejemplo Llama local, Claude y otro compatible con OpenAI) con los mismos tickets; sirve para que una organización pruebe su propio modelo. Resultados en `docs/evaluacion-ia.md`. Tag **`v0.3.0`**. | `feat: script de evaluación de la clasificación` · `docs: resultados de la evaluación de IA` |

## Fase 4 — IA II: base de conocimiento y RAG (días 28–38) · milestone → `v0.4.0`

| Día | Fecha | Rama | Tareas | Commits sugeridos |
|---|---|---|---|---|
| 28 | mié 04/11 | `feat/knowledge-upload` | Módulo `knowledge`: subida de PDF (solo ADMIN, validación de tipo y tamaño) detrás de una interfaz `StorageService` con implementación local (más adelante, S3). | `feat: carga de documentos PDF` |
| 29 | jue 05/11 | `feat/knowledge-chunking` | Extracción de texto y división en fragmentos con solapamiento, como función pura con pruebas unitarias. | `feat: extracción de texto y chunking` · `test: pruebas del chunker` |
| 30 | vie 06/11 | `feat/knowledge-embeddings` | Embeddings con el `EmbeddingProvider` configurado (por defecto `nomic-embed-text`), validando `EMBEDDING_DIMENSIONS` y guardando `embeddingModel` en `DocumentChunk` (columna `vector(768)` mediante SQL crudo). Migración con índice HNSW. | `feat: generación y guardado de embeddings` · `chore: índice HNSW para búsqueda vectorial` |
| 31 | lun 09/11 | `feat/knowledge-search` | Búsqueda por similitud de coseno (`<=>`) en el repositorio, solo entre vectores del modelo configurado. e2e contra pgvector (la CI ya lo tiene como servicio). | `feat: búsqueda por similitud con pgvector` · `test: e2e de búsqueda vectorial` |
| 32 | mar 10/11 | `feat/ai-suggest` | `POST /tickets/:id/suggestion`: vectorizar el ticket, recuperar los k fragmentos más cercanos, generar la respuesta **citando las fuentes** y guardar la `AiSuggestion`. | `feat: sugerencia de respuesta con RAG` |
| 33 | mié 11/11 | `feat/ai-suggest` | Robustez: el contenido de los PDFs se trata como datos y no como instrucciones (mitigar *prompt injection*), límite de contexto, qué hacer si no hay fragmentos relevantes. Pruebas con el proveedor simulado. | `fix: aislar el contexto recuperado en el prompt` · `test: sugerencias con proveedor simulado` |
| 34 | jue 12/11 | `feat/ai-feedback` | Valoración de utilidad (útil / no útil) por parte del técnico. | `feat: valoración de sugerencias` |
| 35 | vie 13/11 | `feat/web-suggestion` | Panel de sugerencia en el detalle del ticket: texto, fuentes con enlace y botones de valoración; se puede copiar a la respuesta y editar. | `feat: panel de sugerencias de la IA en la web` |
| 36 | mar 17/11 | `feat/web-knowledge` | Página de administración de la base de conocimiento: subir, listar y ver el estado de procesamiento. | `feat: administración de la base de conocimiento` |
| 37 | mié 18/11 | `feat/similar-tickets` | **Tickets similares**: vector de cada ticket y `GET /api/tickets/:id/similar` con los resueltos más parecidos, mostrados en el detalle. Comando de reindexación para regenerar vectores al cambiar de modelo. PDFs de ejemplo en el seed y prueba de punta a punta del flujo RAG. | `feat: tickets similares` · `feat: comando de reindexación de embeddings` · `test: flujo RAG de punta a punta` |
| 38 | jue 19/11 | `docs/fase-4` | Actualizar `arquitectura.md` si cambió algo, GIF de la demo en el README. Tag **`v0.4.0`**. | `docs: demo del flujo RAG y cierre de fase 4` |

## Fase 5 — Métricas y nube (días 39–48) · milestone → `v0.5.0`

> Esta fase coincide con el curso de AWS: conviene avanzar el curso en paralelo. **La alerta de facturación se crea antes que cualquier otro recurso.**

| Día | Fecha | Rama | Tareas | Commits sugeridos |
|---|---|---|---|---|
| 39 | vie 20/11 | `feat/metrics` | Módulo `metrics`: tickets por estado, tiempo medio de resolución, precisión de la clasificación por modelo, porcentaje de sugerencias útiles, y uso de tokens y latencia por modelo. | `feat: endpoints de métricas` · `test: consultas de métricas` |
| 40 | lun 23/11 | `feat/web-dashboard` | Tablero de métricas en la web con gráficos. | `feat: tablero de métricas` |
| 41 | mar 24/11 | `feat/docker-images` | Dockerfile multi-etapa de la API y de la web; `docker compose` con el stack completo; *health checks*. | `chore: imágenes Docker de la API y la web` |
| 42 | mié 25/11 | `docs/aws` | Cuenta de AWS con MFA, usuario IAM sin permisos de root y **presupuesto con alerta de facturación**. Documentar en `docs/despliegue.md`. ADR 0008: EC2 o ECS. | `docs: preparación de la cuenta de AWS` · `docs: ADR 0008 estrategia de despliegue` |
| 43 | jue 26/11 | `feat/aws-rds` | RDS PostgreSQL (capa gratuita) con la extensión `vector`, `prisma migrate deploy`, secretos en SSM Parameter Store. | `docs: base de datos en RDS` |
| 44 | vie 27/11 | `feat/storage-s3` | Implementación `S3StorageService` de la interfaz de almacenamiento, elegida por configuración. | `feat: almacenamiento de documentos en S3` · `test: StorageService de S3 simulado` |
| 45 | lun 30/11 | `feat/deploy-api` | Despliegue de la API (EC2 o ECS según el ADR 0008), HTTPS y variables desde SSM. | `chore: despliegue de la API en AWS` |
| 46 | mar 01/12 | `feat/deploy-web` | Web en S3 + CloudFront, CORS con el dominio real. | `chore: despliegue de la web en AWS` |
| 47 | mié 02/12 | `ci/deploy` | Despliegue continuo con GitHub Actions usando **OIDC** (sin claves de AWS guardadas en el repositorio): push a `main` → build → deploy. | `ci: despliegue continuo a AWS con OIDC` |
| 48 | jue 03/12 | `docs/fase-5` | Guía para apagar recursos y evitar costos, URL de la demo en el README. Tag **`v0.5.0`**. | `docs: guía de despliegue y cierre de fase 5` |

## Fase 6 — App móvil y cierre (días 49–58) · milestone → `v1.0.0`

| Día | Fecha | Rama | Tareas | Commits sugeridos |
|---|---|---|---|---|
| 49 | vie 04/12 | `chore/mobile-setup` | Instalar Flutter SDK y Android Studio con emulador (`flutter doctor` en verde). Ejecutar el bootstrap para generar `apps/mobile`. Job de la CI con `flutter analyze` y `flutter test`. | `chore: generar la app móvil con Flutter` · `ci: análisis y pruebas de Flutter` |
| 50 | lun 07/12 | `feat/mobile-base` | Estructura por capas, gestor de estado (ADR 0009: Riverpod o Bloc), cliente HTTP (dio) y URL base por entorno. | `feat: estructura base de la app móvil` · `docs: ADR 0009 gestión de estado en Flutter` |
| 51 | mié 09/12 | `feat/mobile-auth` | Login y guardado seguro del token con `flutter_secure_storage`; cierre de sesión. | `feat: inicio de sesión en la app móvil` · `test: pruebas del repositorio de autenticación` |
| 52 | jue 10/12 | `feat/mobile-tickets` | Lista de "mis tickets" con su estado y *pull to refresh*. | `feat: listado de tickets en móvil` |
| 53 | vie 11/12 | `feat/mobile-tickets` | Crear ticket y ver la clasificación sugerida por la IA. | `feat: crear tickets desde el móvil` |
| 54 | lun 14/12 | `feat/mobile-detail` | Detalle con comentarios; pruebas de widgets. | `feat: detalle de ticket en móvil` · `test: pruebas de widgets` |
| 55 | mar 15/12 | `ci/mobile-release` | APK de *release* generado por la CI y adjunto al GitHub Release. | `ci: generar APK de la app móvil` |
| 56 | mié 16/12 | `docs/readme-final` | README final: badges de la CI, diagrama de arquitectura, capturas de web y móvil, GIF de la demo, enlaces a los ADR. | `docs: README final del proyecto` |
| 57 | jue 17/12 | `fix/pulido` | Revisión general (`/code-review`, `npm audit`), corrección de errores pendientes, limpieza de issues abiertas. | `fix: correcciones de la revisión final` · `chore: actualizar dependencias` |
| 58 | vie 18/12 | `main` | `docs/retrospectiva.md` (qué salió bien, qué se aprendió, qué mejorar), video corto de la demo. PR `develop → main`, tag **`v1.0.0`** y Release final. | `docs: retrospectiva del proyecto` |

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
