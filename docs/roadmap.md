# Hoja de ruta

Cada fase termina con algo funcional y demostrable. Marca las tareas a medida que avances. El calendario día a día está en [plan-diario.md](plan-diario.md).

## Fase 0 — Validación
Corre en paralelo al desarrollo; no lo bloquea.
- [ ] Entrevistar a 3–5 jefes de TI de instituciones educativas, incluyendo la pregunta "¿dónde guardan hoy sus solicitudes?" para priorizar los importadores
- [ ] Conjunto de evaluación con ~50 tickets reales anonimizados, con su categoría, prioridad y solución correctas
- [ ] Precio tentativo por modalidad (on-premise, nube, implementación y migración de datos)

## Fase 1 — MVP del backend
- [x] Generar la API con NestJS y configurar Prisma 7 con PostgreSQL + pgvector (ADR 0003)
- [x] Migración inicial con el modelo de datos
- [x] Configuración validada al arrancar, validación global de entradas, CORS y `GET /api/health`
- [x] Swagger configurado en `/api/docs`
- [x] Integración continua en GitHub Actions (lint, tipos, migraciones, pruebas y build)
- [x] Módulo `users` con repositorio y contraseñas cifradas con bcrypt
- [x] Multi-organización: migración al esquema objetivo del ADR 0005 (organizaciones, categorías como tabla, `vector(1024)`)
- [x] Filtrado centralizado por organización
- [ ] Módulo `auth`: registro, login, JWT con `organizationId` y guards por rol
- [ ] Módulo `tickets`: creación, consulta con filtros, asignación y cambio de estado
- [ ] Categorías configurables por organización
- [ ] Comentarios públicos e internos
- [ ] Historial del ticket (`TicketEvent`)
- [ ] SLA básico por prioridad (tiempos de respuesta y resolución)
- [ ] Documentación completa de los endpoints en Swagger y pruebas unitarias y e2e de cada módulo

## Fase 2 — Web para técnicos
- [ ] Configuración de la app React (router, consultas, pruebas)
- [ ] Inicio de sesión y rutas protegidas por rol
- [ ] Bandeja de tickets con filtros por estado, prioridad y categoría
- [ ] Detalle con comentarios públicos e internos e historial
- [ ] Crear, asignar y cambiar el estado de tickets, con indicadores de SLA
- [ ] Administración de categorías

## Fase 3 — Correo y notificaciones
- [ ] Módulo `jobs` con pg-boss y un worker en segundo plano (ADR 0007)
- [ ] Ingreso de tickets por correo (IMAP): cada correo nuevo crea un ticket y las respuestas se agregan como comentarios
- [ ] Notificaciones por correo al solicitante y al técnico asignado

## Fase 4 — IA I: clasificación
- [x] Configuración de proveedores de chat y embeddings independientes (ADR 0004)
- [ ] Módulo `ai` con los proveedores como transporte (ADR 0006): adaptador compatible con OpenAI y adaptador de Anthropic
- [ ] Clasificación asíncrona en la cola al crear un ticket, con evento `AI_CLASSIFIED`
- [ ] Prompts versionados y salida validada con zod (un reintento y, si falla, sin clasificar)
- [ ] Protección contra *prompt injection* (ADR 0010)
- [ ] El técnico acepta o corrige la sugerencia desde la web
- [ ] Medición de la precisión contra el conjunto de evaluación y contra las correcciones del técnico

## Fase 5 — IA II: RAG
- [ ] Base de conocimiento: carga de PDF/Word, extracción de texto y fragmentos
- [ ] Embeddings con bge-m3 en segundo plano (ADR 0008) e índices HNSW
- [ ] RAG sobre documentos **y** tickets resueltos
- [ ] Sugerencias de respuesta con fuentes citadas
- [ ] Tickets similares ya resueltos en el detalle del ticket
- [ ] Valoración de utilidad de las sugerencias por parte del técnico
- [ ] Comando de reindexación al cambiar de modelo de embeddings
- [ ] Tablero de métricas: volumen, cumplimiento de SLA, precisión de la IA y utilidad de las sugerencias

## Fase 6 — Importación multifuente
- [ ] Módulo `imports`: staging (`ImportRecord`) y revisión humana antes de importar (ADR 0009)
- [ ] Importador CSV/Excel con mapeo de columnas, categorías, prioridades y usuarios en pantalla
- [ ] Plantillas de mapeo reutilizables
- [ ] Idempotencia: reimportar no duplica tickets
- [ ] Reindexación de embeddings de lo importado
- [ ] Adaptador de GLPI por API REST
- [ ] Extracción asistida por IA desde PDF/Word y buzón de correo, con revisión obligatoria
- [ ] Arranque en frío para organizaciones sin historial

## Fase 7 — Empaquetado on-premise
- [ ] Imágenes de producción de la API, el worker y la web
- [ ] `docker compose` de producción sin puertos internos publicados
- [ ] Script de instalación que crea la organización inicial
- [ ] Respaldos automáticos de la base de datos
- [ ] Actualización sin conexión a internet
- [ ] Guía de hardware para correr los modelos localmente
- [ ] Revisión de licencias de todo lo que se distribuye (ADR 0011)

## Fase 8 — Nube multi-organización
- [ ] Alerta de facturación en AWS (antes de crear cualquier recurso)
- [ ] Base de datos en RDS y documentos en S3
- [ ] Despliegue continuo desde GitHub Actions
- [ ] Aislamiento entre organizaciones reforzado (evaluar Row Level Security)
- [ ] Registro de organizaciones nuevas

## Fase 9 — App móvil
- [ ] App Flutter para crear tickets y consultar su estado
- [ ] Inicio de sesión y almacenamiento seguro del token
- [ ] Evaluar WhatsApp como canal de ingreso de tickets

## Mejoras futuras

Ideas valiosas sin fase asignada todavía:

- Configurar el proveedor de IA desde un panel de administración (claves cifradas en la base de datos)
- Proveedor de IA de respaldo cuando el principal falla
- Ocultar datos personales (correos, documentos, teléfonos) antes de enviar texto a un proveedor externo
- Límite de peticiones y *refresh tokens* en la autenticación
- Uso de tokens y latencia por modelo de IA en las métricas
- (Opcional) Proveedor de IA con Amazon Bedrock
