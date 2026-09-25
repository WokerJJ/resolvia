# ADR 0004 — Proveedores de chat y embeddings intercambiables

**Estado:** Aceptada · **Fecha:** 2026-09-25 · **Reemplaza a:** [ADR 0001](0001-proveedor-llm-intercambiable.md)

## Contexto

El ADR 0001 definió una interfaz `LLMProvider` con dos implementaciones (Ollama y Anthropic) y fijó los embeddings en Ollama `nomic-embed-text` (768 dimensiones). La idea de fondo sigue siendo válida: el dominio no depende de ningún proveedor concreto.

Pensando en una organización real que adopte Resolvia, aparecen tres limitaciones:

1. **Cada empresa tiene su propio proveedor.** Puede usar OpenAI, Azure OpenAI, Gemini, Mistral, Amazon Bedrock o un modelo propio servido con vLLM. Escribir una clase por proveedor no escala.
2. **Los embeddings no se podían elegir.** Una empresa cuya política exige que ningún dato salga de su infraestructura (o que ya paga un modelo de embeddings) debe poder controlar también ese modelo, no solo el de chat. Además, el esquema fijaba `vector(768)`.
3. **No todos los modelos responden igual de bien.** Los modelos pequeños o sin salida estructurada pueden devolver JSON inválido o categorías que no existen.

## Decisión

### 1. Dos interfaces separadas

```ts
export interface ChatProvider {
  classify(input: TicketInput): Promise<Classification>;
  generate(prompt: string, context: string[]): Promise<string>;
}

export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
}
```

Chat y embeddings se configuran por separado. Por ejemplo: chat con Claude y embeddings locales con Ollama, o todo dentro de la red de la empresa.

### 2. Un adaptador compatible con OpenAI como opción universal

La mayoría de proveedores y servidores de modelos exponen la API de OpenAI (`/v1/chat/completions` y `/v1/embeddings`): OpenAI, Azure OpenAI, Gemini, Groq, Mistral, DeepSeek, vLLM, LM Studio y **el propio Ollama**. Por eso se implementa un único `OpenAICompatibleProvider` configurado con URL base, clave y modelo. Con él, conectar un proveedor nuevo es cuestión de configuración, no de código.

Implementaciones previstas:

| Implementación | Chat | Embeddings | Cuándo |
|---|---|---|---|
| `OpenAICompatibleProvider` | ✅ | ✅ | Fase 3 (por defecto, apuntando a Ollama local) |
| `AnthropicProvider` | ✅ | — (Anthropic no ofrece embeddings) | Fase 3 |
| `BedrockProvider` | ✅ | ✅ | Opcional en la fase 5, junto con AWS |

Ollama deja de necesitar una clase propia: se usa a través de su API compatible con OpenAI.

### 3. Configuración por variables de entorno

| Variable | Uso | Valor local por defecto |
|---|---|---|
| `LLM_PROVIDER` | `openai-compatible` o `anthropic` | `openai-compatible` |
| `LLM_BASE_URL` | URL de la API compatible con OpenAI | `http://localhost:11434/v1` |
| `LLM_API_KEY` | Clave del proveedor (obligatoria con `anthropic`) | vacía |
| `LLM_CHAT_MODEL` | Modelo de chat | `llama3.2:3b` |
| `EMBEDDING_BASE_URL` | URL de la API de embeddings | `http://localhost:11434/v1` |
| `EMBEDDING_API_KEY` | Clave del proveedor de embeddings | vacía |
| `EMBEDDING_MODEL` | Modelo de embeddings | `nomic-embed-text` |
| `EMBEDDING_DIMENSIONS` | Dimensiones del vector | `768` |

La configuración es por despliegue. Elegir el proveedor desde un panel de administración (con claves cifradas en la base de datos) implica soporte multiempresa y queda como mejora futura.

### 4. Trazabilidad del modelo

- Cada ticket guarda en `aiModel` qué modelo hizo la clasificación, y cada `AiSuggestion` guarda el suyo en `model`. Así las métricas de precisión se pueden comparar por modelo.
- Cada `DocumentChunk` guarda en `embeddingModel` qué modelo generó su vector. Nunca se mezclan en una búsqueda vectores de modelos distintos.

### 5. Cambio de modelo de embeddings

La columna sigue siendo `vector(768)` porque el índice HNSW de pgvector necesita una dimensión fija. Si una empresa usa otro modelo:

- Con **la misma dimensión**: basta con cambiar las variables y ejecutar el comando de reindexación (fase 4), que regenera los vectores de la base de conocimiento.
- Con **otra dimensión** (por ejemplo 1536): se crea una migración que cambia la columna y el índice, y luego se reindexa.

`EMBEDDING_DIMENSIONS` permite validar al arrancar y en cada respuesta que el proveedor devuelve vectores del tamaño esperado, con un error claro en vez de fallar al guardar.

### 6. Tolerancia a respuestas inválidas

Toda respuesta de clasificación se valida con un esquema (zod). Si es inválida se reintenta una vez indicando el error al modelo; si vuelve a fallar, el ticket queda **sin clasificar** y el técnico decide. Un modelo débil nunca rompe el flujo de tickets.

## Consecuencias

- El mensaje del proyecto pasa de "usa Claude u Ollama" a "funciona con el modelo que tu organización ya tenga, incluso dentro de su propia infraestructura".
- Menos código que mantener: una implementación cubre la mayoría de proveedores.
- Las pruebas siguen usando proveedores simulados (`FakeChatProvider`, `FakeEmbeddingProvider`); nunca llaman a un modelo real.
- Las diferencias entre proveedores (salida estructurada, límites de contexto) se absorben con validación y reintento, no con ramas de código por proveedor.
- Cambiar de modelo de embeddings sigue exigiendo regenerar los vectores; ahora está documentado y automatizado con el comando de reindexación.
- El script de evaluación de la fase 3 sirve para que una organización compare modelos con sus propios tickets antes de elegir.
