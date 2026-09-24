# ADR 0001 — Proveedor de LLM intercambiable

**Estado:** Aceptada · **Fecha:** 2026-09-24

## Contexto

El proyecto necesita un modelo de lenguaje para clasificar tickets y redactar sugerencias. Los modelos grandes no corren en un equipo personal, y usar solo una API externa genera costos y dependencia de conexión durante el desarrollo.

## Decisión

Se define una interfaz `LLMProvider` en el módulo `ai`:

```ts
export interface LLMProvider {
  classify(input: TicketInput): Promise<Classification>;
  generate(prompt: string, context: string[]): Promise<string>;
}
```

Con dos implementaciones:

- `OllamaProvider` — modelo local liviano (por ejemplo `llama3.2:3b`) para desarrollo sin costo.
- `AnthropicProvider` — API externa para mayor calidad en demostraciones y producción.

La implementación se elige con la variable `LLM_PROVIDER` y se inyecta mediante el sistema de inyección de dependencias de NestJS.

Los **embeddings** se generan siempre con Ollama (`nomic-embed-text`, 768 dimensiones), porque es un modelo pequeño que corre sin problema en local y mantiene los vectores consistentes sin importar el proveedor de chat.

## Consecuencias

- La lógica de negocio no depende de ningún proveedor (principio de inversión de dependencias).
- Las pruebas usan un proveedor simulado, sin llamar a ningún modelo real.
- Agregar otro proveedor solo requiere una nueva clase que implemente la interfaz.
- Cambiar el modelo de embeddings exige regenerar los vectores existentes.
