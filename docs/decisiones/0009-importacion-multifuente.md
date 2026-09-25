# ADR 0009 — Importación multifuente

**Estado:** Aceptada · **Fecha:** 2026-09-25

## Contexto

Una organización que adopta Resolvia no empieza de cero: su historial de solicitudes resueltas es justamente lo que la IA necesita para aprender cómo resuelve problemas su equipo. Ese historial puede estar en GLPI, en otra herramienta de helpdesk, en hojas de Excel o CSV, en documentos PDF o Word, en un buzón de correo, o no existir. Si migrar implica perder el historial, la organización pierde el principal motivo para cambiar.

## Decisión

### Formato canónico

Toda fuente se traduce a un único formato intermedio:

```ts
export interface NormalizedTicket {
  externalId?: string;        // id en el sistema de origen
  title: string;
  description: string;
  createdAt: Date;
  category?: string;          // categoría original, sin mapear
  priority?: string;          // prioridad original, sin mapear
  status?: string;            // estado original, sin mapear
  resolution?: string;        // solución aplicada
  comments: { author?: string; body: string; createdAt: Date }[];
  requesterEmail?: string;    // solicitante
}
```

### Puertos y adaptadores

```ts
export interface ImportAdapter {
  readonly source: string; // 'csv', 'glpi', 'document', 'email'...
  extract(job: ImportJob): AsyncIterable<NormalizedTicket>;
}
```

El núcleo de importación solo conoce esta interfaz; cada fuente es un adaptador. Agregar una herramienta nueva no toca el flujo común.

### Flujo común

1. **Extraer:** el adaptador lee la fuente y produce `NormalizedTicket`.
2. **Staging:** cada registro se guarda en `ImportRecord` con el dato original y el normalizado, sin crear tickets todavía.
3. **Mapeo configurable:** columnas, categorías, prioridades, estados y usuarios de origen hacia los de la organización.
4. **Revisión humana:** el administrador acepta o rechaza registros antes de importar.
5. **Importar:** se crean tickets (`source = IMPORT`), comentarios y eventos `IMPORTED`.
6. **Reindexar:** se generan los embeddings de los tickets importados, en segundo plano (ADR 0007).

### Adaptadores, en orden

1. **CSV/Excel** con mapeo de columnas en pantalla. Es el comodín universal: casi cualquier herramienta exporta CSV.
2. **GLPI** por su API REST.
3. **Documentos PDF/Word y buzón de correo** con extracción asistida por el LLM. La revisión humana es **obligatoria**, porque la extracción puede equivocarse, y cada registro queda marcado con `extractedByAi`.
4. **Otras herramientas** (osTicket, Zammad, Jira Service Management…) según la demanda que muestre la fase de validación.

### Mapeo de GLPI

| GLPI | Resolvia |
|---|---|
| `ITILCategory` | `Category` |
| `Ticket` | `Ticket` |
| `ITILFollowup` | `Comment` |
| `ITILSolution` | `Ticket.resolution` |
| Usuarios | Usuarios, por correo |

| Prioridad GLPI | Resolvia |
|---|---|
| 1–2 | `LOW` |
| 3 | `MEDIUM` |
| 4 | `HIGH` |
| 5–6 | `CRITICAL` |

| Estado GLPI | Resolvia |
|---|---|
| 1 | `OPEN` |
| 2–3 | `IN_PROGRESS` |
| 4 | `WAITING_USER` |
| 5 | `RESOLVED` |
| 6 | `CLOSED` |

### Modelos

```prisma
enum ImportJobStatus { PENDING EXTRACTING REVIEW IMPORTING DONE FAILED }
enum ImportRecordStatus { PENDING ACCEPTED REJECTED IMPORTED ERROR }

model ImportJob {
  id             String          @id @default(uuid())
  organizationId String
  source         String          // 'csv', 'glpi', 'document', 'email'...
  mapping        Json
  fileKey        String?         // archivo subido, si la fuente es un archivo
  status         ImportJobStatus @default(PENDING)
  stats          Json?
  error          String?
  createdById    String
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}

// Staging: nada se convierte en ticket sin pasar por aquí.
model ImportRecord {
  id            String             @id @default(uuid())
  importJobId   String
  raw           Json               // dato original, tal como vino
  normalized    Json               // NormalizedTicket
  contentHash   String             // para detectar duplicados sin id externo
  status        ImportRecordStatus @default(PENDING)
  error         String?
  extractedByAi Boolean            @default(false)
  ticketId      String?
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt
}

// Mapeos guardados para reutilizarlos en importaciones futuras.
model ImportMappingTemplate {
  id             String @id @default(uuid())
  organizationId String
  source         String
  name           String
  mapping        Json
}
```

### Otras reglas

- **Idempotencia:** reimportar no duplica. Un ticket importado se identifica por organización, fuente (`externalSource`) e id externo (ver el esquema del ADR 0005); si la fuente no tiene id, por el hash del contenido.
- **Manual o bitácora:** al cargar documentos se distingue entre un manual o procedimiento, que va a la base de conocimiento (RAG), y un historial o bitácora de casos, que va al importador.
- **Arranque en frío:** una organización sin historial empieza con su base de conocimiento, plantillas de categorías y aprendizaje desde el primer ticket resuelto.
- La migración de datos de un cliente se puede ofrecer como **servicio de implementación**.

## Consecuencias

- Cambiar a Resolvia no obliga a perder el historial, que es lo que hace útil a la IA desde el primer día.
- El staging y la revisión humana hacen la importación más lenta que una carga directa, pero evitan llenar el sistema de datos mal mapeados, lo que sería difícil de deshacer.
- Cada adaptador nuevo es un proyecto acotado: implementar `extract` y un mapeo por defecto.
- La extracción con LLM consume tiempo de modelo y puede equivocarse; por eso siempre pasa por revisión y se marca.
