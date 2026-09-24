# Hoja de ruta

Cada fase termina con algo funcional y demostrable. Marca las tareas a medida que avances.

## Fase 1 — MVP del backend
- [ ] Generar la API con NestJS y configurar Prisma
- [ ] Migración inicial con el modelo de datos
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
- [ ] Interfaz `LLMProvider` con implementaciones Ollama y API externa
- [ ] Clasificación automática al crear un ticket (respuesta en JSON validado)
- [ ] Guardar categoría, prioridad y confianza sugeridas
- [ ] Pruebas con un proveedor simulado (*mock*)

## Fase 4 — IA II: base de conocimiento y RAG
- [ ] Carga de PDFs y extracción de texto
- [ ] División en fragmentos y generación de embeddings
- [ ] Búsqueda por similitud con pgvector
- [ ] Sugerencia de respuesta con fuentes citadas
- [ ] Valoración de utilidad por parte del técnico

## Fase 5 — App móvil
- [ ] Generar la app con Flutter
- [ ] Inicio de sesión y almacenamiento seguro del token
- [ ] Crear tickets y consultar su estado

## Fase 6 — Nube y métricas
- [ ] Tablero de métricas en la web
- [ ] Alerta de facturación en AWS (antes de crear cualquier recurso)
- [ ] Base de datos en RDS y documentos en S3
- [ ] Despliegue de la API (EC2 o ECS) y de la web
- [ ] Despliegue continuo desde GitHub Actions
