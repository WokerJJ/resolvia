# ADR 0007 — Procesamiento asíncrono con pg-boss

**Estado:** Aceptada · **Fecha:** 2026-09-25

## Contexto

Un LLM local en hardware modesto puede tardar entre 5 y 30 segundos en responder. Si la API clasificara el ticket dentro de la misma petición que lo crea, el usuario esperaría todo ese tiempo, y un fallo del modelo haría fallar la creación del ticket.

Lo mismo ocurre con otras tareas lentas o que dependen de servicios externos: generar embeddings, preparar sugerencias, procesar importaciones y leer el buzón de correo.

## Decisión

- Las tareas lentas se ejecutan **en segundo plano**, en una cola de trabajos:
  - clasificar un ticket;
  - generar embeddings de tickets y documentos;
  - preparar sugerencias;
  - extraer e importar datos (ADR 0009);
  - leer el correo entrante y enviar notificaciones.
- **La creación del ticket responde de inmediato.** Un *worker* toma el trabajo, clasifica el ticket y registra el resultado con un evento `AI_CLASSIFIED`. Mientras tanto, la interfaz muestra el ticket como "pendiente de clasificar".
- Se usa **pg-boss**, que guarda la cola en la **misma PostgreSQL** (en su propio esquema). No se agrega Redis ni otro servicio al paquete on-premise.
- El worker comparte el código de la API (mismos módulos, servicios y repositorios) pero se arranca con su propio punto de entrada, para poder ejecutarlo en otro proceso o contenedor.
- Los trabajos son **idempotentes** y tienen reintentos con espera creciente: procesar dos veces el mismo trabajo no duplica resultados.

### Alternativas descartadas

- **BullMQ con Redis:** muy usada, pero agrega un servicio más que instalar, respaldar y actualizar en cada institución.
- **Procesar dentro de la petición:** simple, pero bloquea al usuario y acopla la disponibilidad de la API a la del modelo.
- **Eventos en memoria:** los trabajos pendientes se pierden si el proceso se reinicia.

## Consecuencias

- La API sigue respondiendo rápido aunque el modelo sea lento o esté caído.
- La consistencia es **eventual**: la clasificación aparece segundos después de crear el ticket, y la interfaz debe mostrarlo.
- La base de datos también sostiene la cola; en instalaciones grandes habrá que vigilar su carga.
- Las pruebas e2e necesitan una forma de ejecutar los trabajos pendientes de manera controlada, en lugar de esperar tiempos arbitrarios.
- pg-boss crea y actualiza su propio esquema al arrancar; no forma parte de las migraciones de Prisma.
