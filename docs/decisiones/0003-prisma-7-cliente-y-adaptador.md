# ADR 0003 — Prisma 7: generador `prisma-client` y adaptador `pg`

**Estado:** Aceptada · **Fecha:** 2026-09-24

## Contexto

El bootstrap instaló Prisma 7, que cambia la forma de configurar el ORM respecto a versiones anteriores:

- La URL de conexión ya no se admite dentro del `schema.prisma`.
- El cliente ya no se conecta con un motor propio en Rust: necesita un **driver adapter** (por ejemplo `@prisma/adapter-pg`, basado en el paquete `pg`).
- El generador clásico `prisma-client-js` (que escribe CommonJS dentro de `node_modules`) queda deprecado en favor de `prisma-client`, y la versión 8 ya está en *release candidate*.

Además, la API generada por NestJS 12 es un proyecto **ESM** (`"type": "module"`).

## Decisión

- **Configuración:** la URL vive en `apps/api/prisma.config.ts`, que carga el `.env` de la raíz del monorepo. Lo usan los comandos de la CLI (`migrate`, `generate`, `studio`).
- **Generador:** `prisma-client` con `moduleFormat = "esm"` e `importFileExtension = "js"`, que genera TypeScript en `apps/api/src/generated/prisma`. Esa carpeta no se versiona: se regenera con `npx prisma generate`, que corre solo en el `postinstall` de la API (también en la CI).
- **Conexión:** `PrismaService` extiende el cliente generado y le pasa un `PrismaPg` con `DATABASE_URL`, leída desde `ConfigService` ya validada.
- **Versiones:** `prisma`, `@prisma/client` y `@prisma/adapter-pg` quedan fijadas en la misma versión exacta (7.10.0), porque el tag `latest` de npm apuntaba a un *release candidate*.

## Consecuencias

- El cliente generado es TypeScript ESM normal: se importa con una ruta relativa (`../generated/prisma/client.js`) y se compila con el resto del código.
- La migración a Prisma 8 debería ser menor, porque ya usamos el generador y la configuración nuevos.
- El adaptador `pg` usa un pool de conexiones de Node; más adelante se podrá ajustar su tamaño para RDS.
- `prisma.config.ts` lee `DATABASE_URL` sin el helper `env()`: así `prisma generate` (y por tanto `npm install`) funciona sin `.env`, mientras que `migrate` falla con un error claro si falta la URL.
- Actualizar Prisma implica subir los tres paquetes juntos y regenerar el cliente.
