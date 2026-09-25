# ADR 0006 — Proveedores de IA como transporte

**Estado:** Aceptada · **Fecha:** 2026-09-25 · **Modifica a:** [ADR 0004](0004-proveedores-de-chat-y-embeddings.md)

## Contexto

El ADR 0004 definió un `ChatProvider` con métodos de negocio (`classify` y `generate`). Con ese diseño, cada adaptador (compatible con OpenAI, Anthropic y los que vengan) tendría que construir su propio prompt de clasificación y de sugerencia. Eso duplica los prompts por proveedor: una mejora al prompt habría que repetirla en cada adaptador, y medir la precisión por versión de prompt se vuelve confuso.

## Decisión

### El proveedor solo transporta

Los adaptadores no conocen tickets, categorías ni RAG: reciben mensajes y devuelven texto o vectores.

```ts
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatProvider {
  /** Proveedor y modelo, para registrarlo en cada resultado (aiModel, AiSuggestion.model). */
  readonly model: string;
  complete(req: {
    system: string;
    messages: ChatMessage[];
    json?: boolean; // pedir salida JSON si el proveedor lo soporta
  }): Promise<string>;
}

export interface EmbeddingProvider {
  readonly model: string;
  readonly dimensions: number;
  embed(texts: string[]): Promise<number[][]>;
}
```

### La lógica vive en servicios del dominio

- **`TicketClassifierService`** construye el prompt de clasificación **una sola vez**, con las categorías de la organización, llama a `complete({ json: true })` y valida la respuesta con un esquema **zod**.
- **`SuggestionService`** construye el prompt de sugerencia con los fragmentos recuperados (RAG) y exige citar las fuentes.
- Se conserva lo decidido en el ADR 0004: si la respuesta no cumple el esquema se reintenta una vez indicando el error al modelo; si vuelve a fallar, el ticket queda **sin clasificar** y el técnico decide.
- Cada prompt tiene una **versión** (`promptVersion`), que se guarda junto a cada resultado para comparar la precisión entre versiones.

### Lo que no cambia del ADR 0004

La separación entre chat y embeddings, el `OpenAICompatibleProvider` como adaptador universal, el `AnthropicProvider`, la configuración con `LLM_*` y `EMBEDDING_*`, y el registro del modelo que produjo cada resultado.

## Consecuencias

- Un prompt se mejora en un solo lugar y se prueba una sola vez, con un `FakeChatProvider` que devuelve respuestas fijas.
- Los adaptadores quedan pequeños: traducen el formato de mensajes y la opción `json` a la API de cada proveedor (por ejemplo `response_format` en la API compatible con OpenAI).
- Si un proveedor no ofrece un modo JSON, el adaptador lo pide por instrucción y la validación con zod sigue siendo la garantía.
- El módulo `ai` todavía no está implementado (el ADR 0004 solo dejó la configuración), así que no hay código que refactorizar: la fase de IA lo construye directamente con este diseño.
