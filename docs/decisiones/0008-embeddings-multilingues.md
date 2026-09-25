# ADR 0008 — Embeddings multilingües con bge-m3

**Estado:** Aceptada · **Fecha:** 2026-09-25 · **Modifica a:** [ADR 0004](0004-proveedores-de-chat-y-embeddings.md) (modelo de embeddings por defecto)

## Contexto

El ADR 0004 dejó `nomic-embed-text` (768 dimensiones) como modelo de embeddings por defecto. Ese modelo rinde mejor en inglés, pero los tickets, manuales y procedimientos de las organizaciones a las que apunta Resolvia están en español, a menudo mezclado con términos técnicos en inglés. La calidad de la búsqueda (RAG y tickets similares) depende directamente de que los embeddings entiendan bien ese texto.

Además, el ADR 0004 guarda una `aiConfidence` informada por el propio modelo al clasificar.

## Decisión

### Modelo de embeddings

- El modelo por defecto pasa a ser **bge-m3**, multilingüe, de **1024 dimensiones** y disponible en Ollama, así que corre dentro de la institución.
- Hoy la columna es `vector(768)`. El cambio a `vector(1024)` se hace en la migración de multi-organización (ADR 0005), junto con `EMBEDDING_MODEL=bge-m3` y `EMBEDDING_DIMENSIONS=1024`. Como todavía no hay vectores guardados, no hay nada que reindexar.
- Se mantiene lo decidido en el ADR 0004: cada vector guarda el modelo que lo generó (`embeddingModel`), para poder reindexar si se cambia de modelo y no mezclar vectores de modelos distintos en una búsqueda.

### Confianza de la clasificación

- La confianza que el LLM informa sobre sí mismo **no es fiable**: los modelos suelen declararse seguros incluso cuando se equivocan. Se puede mostrar como dato orientativo, pero no se usa para decidir nada.
- La **precisión real** se mide comparando la categoría sugerida por la IA (`aiCategoryId`) con la que termina asignando el técnico (`categoryId`), usando el historial de eventos (`AI_CLASSIFIED` y `CATEGORY_CHANGED`) y el conjunto de evaluación de la fase de validación.

## Consecuencias

- Mejor recuperación en español sin enviar los textos a un servicio externo.
- bge-m3 es más grande que nomic-embed-text: necesita más memoria y tarda más por texto, algo que la guía de hardware on-premise debe contemplar.
- Los vectores de 1024 dimensiones ocupan más espacio; siguen dentro de lo que admite el índice HNSW de pgvector.
- La métrica de precisión se basa en decisiones reales del equipo, no en la opinión del modelo sobre sí mismo.
