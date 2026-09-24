import path from 'node:path';
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// El .env vive en la raíz del monorepo, no en apps/api.
config({ path: path.resolve(import.meta.dirname, '../../.env'), quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Se lee sin el helper env() para que `prisma generate` (postinstall) funcione
  // sin .env; los comandos que sí usan la base de datos fallan si falta la URL.
  datasource: { url: process.env.DATABASE_URL },
});
