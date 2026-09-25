# ADR 0005 — Despliegue on-premise y nube multi-organización

**Estado:** Aceptada · **Fecha:** 2026-09-25

## Contexto

Resolvia se orienta a instituciones educativas y pymes con un argumento central: la IA puede correr dentro de la institución y los datos no salen de ella. Eso exige una **instalación on-premise** que una organización opera por su cuenta. Al mismo tiempo, muchas organizaciones pequeñas no tienen quién administre un servidor y preferirán un servicio en la **nube**, donde una sola instalación atiende a varias organizaciones.

El modelo de datos actual no tiene el concepto de organización: usuarios, tickets y documentos son globales, y las categorías son un enum fijo (`TicketCategory`) igual para todos. Agregar la organización después, con datos reales y la autenticación ya construida, sería mucho más costoso que hacerlo ahora.

## Decisión

### Un solo modelo de datos para los dos modos

- Se agrega el modelo `Organization` y un `organizationId` obligatorio en todas las entidades de negocio: `User`, `Ticket`, `Category`, `KnowledgeDocument`, `SlaPolicy` y las de importación (ADR 0009). Las entidades hijas (`Comment`, `TicketEvent`, `AiSuggestion`, `DocumentChunk`) heredan la organización de su padre.
- **On-premise:** una sola organización, creada durante la instalación.
- **Nube:** varias organizaciones en la misma base de datos.
- La variable `DEPLOYMENT_MODE` (`onprem` | `cloud`) activa lo que cambia entre modos, por ejemplo si se permite registrar organizaciones nuevas. Se agrega y valida cuando se implemente.

### Usuarios y autenticación

- El **correo es único global** y cada usuario pertenece a **una sola organización**. Así el inicio de sesión no necesita elegir organización: el correo la determina.
- El JWT incluye `organizationId` además del id y el rol del usuario. Por eso la multi-organización se implementa **antes** que la autenticación.

### Aislamiento entre organizaciones

- El filtrado por organización se centraliza en una **extensión del cliente de Prisma** que agrega `organizationId` a las consultas de los modelos de negocio a partir del contexto de la petición. Los repositorios no repiten el filtro a mano, así que olvidarlo no filtra datos entre organizaciones.
- En la fase de nube se evaluará además **Row Level Security** de PostgreSQL como segunda barrera, dentro de la propia base de datos.

### Esquema objetivo

```prisma
model Organization {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Reemplaza al enum TicketCategory: cada organización define sus categorías.
model Category {
  id             String  @id @default(uuid())
  organizationId String
  name           String
  description    String?
  active         Boolean @default(true)

  @@unique([organizationId, name])
}

enum TicketSource { WEB EMAIL MOBILE IMPORT }

model Ticket {
  // ...campos actuales, más:
  organizationId  String
  source          TicketSource @default(WEB)
  categoryId      String?      // categoría final (la decide el técnico)
  aiCategoryId    String?      // categoría sugerida por la IA
  importJobId     String?
  externalSource  String?      // origen del id externo, por ejemplo "glpi" (ADR 0009)
  externalId      String?
  resolution      String?
  firstResponseAt DateTime?
  dueAt           DateTime?
  closedAt        DateTime?
  embedding       Unsupported("vector(1024)")? // ADR 0008
  embeddingModel  String?

  @@unique([organizationId, externalSource, externalId])
  @@index([organizationId, status])
}

model Comment {
  // ...campos actuales, más:
  isInternal Boolean @default(false) // nota interna del equipo, invisible para el solicitante
}

enum TicketEventType {
  CREATED STATUS_CHANGED ASSIGNED PRIORITY_CHANGED
  CATEGORY_CHANGED AI_CLASSIFIED COMMENTED IMPORTED
}

// Historial del ticket: quién hizo qué y cuándo.
model TicketEvent {
  id        String          @id @default(uuid())
  ticketId  String
  actorId   String?         // null = el sistema o la IA
  type      TicketEventType
  data      Json
  createdAt DateTime        @default(now())
}

model SlaPolicy {
  id                String         @id @default(uuid())
  organizationId    String
  priority          TicketPriority
  responseMinutes   Int
  resolutionMinutes Int

  @@unique([organizationId, priority])
}

model AiSuggestion {
  // ...campos actuales, más:
  promptVersion String // versión del prompt que generó la sugerencia
}
```

`KnowledgeDocument` y `DocumentChunk` reciben `organizationId` (el documento) y pasan a `vector(1024)` con su `embeddingModel`. Los modelos de importación se definen en el ADR 0009.

## Consecuencias

- Un solo código sirve para los dos modos; la diferencia es de configuración, no de ramas de código.
- Todas las consultas de negocio dependen del contexto de organización. Las pruebas deben cubrir explícitamente que una organización no ve datos de otra.
- Las categorías configurables permiten que cada organización use su propio vocabulario, y que la IA las aprenda en lugar de forzar una lista fija.
- `TicketEvent` y `SlaPolicy` dan historial de auditoría y tiempos de servicio, necesarios para las métricas y para comparar la IA contra las decisiones del técnico.
- La migración cambia el esquema existente: el módulo `users` y sus pruebas deben incorporar `organizationId`. Se hace ahora, cuando aún no hay datos reales que migrar.
- Con el correo único global, una misma persona no puede tener cuenta en dos organizaciones con el mismo correo. Se acepta esa limitación a cambio de un inicio de sesión más simple.
