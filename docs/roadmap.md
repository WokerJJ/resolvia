# Hoja de ruta

Cada fase termina con algo funcional y demostrable. Marca las tareas a medida que avances.

## Fase 1 — MVP del backend
- [x] Generar la API con NestJS y configurar Prisma
- [x] Migración inicial con el modelo de datos
- [ ] Módulo `auth`: registro, login, JWT y guards por rol
- [ ] Módulo `tickets`: CRUD, asignación, cambio de estado y comentarios
- [ ] Validación de entradas con DTOs (`class-validator`)
- [ ] Documentación de la API con Swagger
- [ ] Pruebas unitarias de servicios y pruebas e2e con Supertest
- [ ] Integración continua funcionando en GitHub Actions

## Fase 2 — Frontend web
- [ ] Generar la app con Vite + React + TypeScript
- [ ] Inicio de sesión y rutas protegidas por rol
- [ ] Bandeja de tickets con filtros por estado, prioridad y categoría
- [ ] Vista de detalle con comentarios

## Fase 3 — IA I: clasificación
- [x] Configuración de proveedores de chat y embeddings independientes (ADR 0004)
- [ ] Interfaces `ChatProvider` y `EmbeddingProvider`
- [ ] Adaptador compatible con la API de OpenAI (OpenAI, Azure OpenAI, Gemini, vLLM, Ollama…) y adaptador de Anthropic
- [ ] Clasificación automática al crear un ticket (JSON validado, un reintento y, si falla, ticket sin clasificar)
- [ ] Guardar categoría, prioridad, confianza y modelo sugeridos
- [ ] Pruebas con proveedores simulados (*mocks*)
- [ ] Evaluación de precisión comparando modelos con los mismos tickets

## Fase 4 — IA II: base de conocimiento y RAG
- [ ] Carga de PDFs y extracción de texto
- [ ] División en fragmentos y generación de embeddings con el proveedor configurado, registrando el modelo
- [ ] Búsqueda por similitud con pgvector
- [ ] Sugerencia de respuesta con fuentes citadas
- [ ] Valoración de utilidad por parte del técnico
- [ ] Comando de reindexación al cambiar de modelo de embeddings
- [ ] Tickets similares ya resueltos en el detalle del ticket

## Fase 5 — Nube y métricas
- [ ] Tablero de métricas en la web
- [ ] Uso de tokens y latencia por modelo de IA
- [ ] Alerta de facturación en AWS (antes de crear cualquier recurso)
- [ ] Base de datos en RDS y documentos en S3
- [ ] Despliegue de la API (EC2 o ECS) y de la web
- [ ] Despliegue continuo desde GitHub Actions
- [ ] (Opcional) Proveedor de IA con Amazon Bedrock

## Fase 6 — App móvil
- [ ] Generar la app con Flutter
- [ ] Inicio de sesión y almacenamiento seguro del token
- [ ] Crear tickets y consultar su estado

## Mejoras futuras

Ideas valiosas que quedan fuera del alcance de la v1.0.0 para no comprometer las fechas:

- Configurar el proveedor de IA desde un panel de administración (varias organizaciones, claves cifradas en la base de datos)
- Proveedor de IA de respaldo cuando el principal falla
- Ocultar datos personales (correos, documentos, teléfonos) antes de enviar texto a un proveedor externo
- Crear tickets a partir de correos electrónicos
- Acuerdos de nivel de servicio (SLA) por prioridad, con alertas y métrica de cumplimiento
- Historial de auditoría: quién cambió qué y si se aceptó o corrigió la sugerencia de la IA
- Límite de peticiones y *refresh tokens* en la autenticación
