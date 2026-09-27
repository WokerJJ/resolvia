/**
 * Development seed: `npm run db:seed` (or `npx prisma db seed`) from apps/api.
 * Creates the organization DEFAULT_ORG_NAME with one user per role, base
 * categories and the default SLA. Development only: its passwords are public.
 * It requires ALLOW_DEV_SEED=true in .env, refuses NODE_ENV=production and
 * refuses an organization that already has users other than the seeded ones.
 */
import path from 'node:path';
import { config } from 'dotenv';
import { validateEnv } from '../src/config/env.validation.js';
import { OrganizationContext } from '../src/organizations/organization-context.js';
import { createPrismaService } from '../src/prisma/prisma.service.js';
import {
  DEVELOPMENT_PASSWORD,
  seedDevelopmentData,
} from './seed/development-data.js';
import { assertDevelopmentSeedAllowed } from './seed/development-seed-guard.js';

config({
  path: path.resolve(import.meta.dirname, '../../../.env'),
  quiet: true,
});

// Checked before connecting: without the explicit opt-in nothing is touched.
try {
  assertDevelopmentSeedAllowed(process.env);
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}

// Same validation as the API: an invalid .env fails here with the same message.
const env = validateEnv(process.env);
const context = new OrganizationContext();
const prisma = createPrismaService(env.DATABASE_URL, context);

try {
  const { organization, users } = await seedDevelopmentData(prisma, context, {
    organizationName: env.DEFAULT_ORG_NAME,
    emailDomain: 'resolvia.test',
  });

  console.log(`Organization: ${organization.name} (${organization.slug})`);
  for (const user of users) {
    console.log(`  ${user.role.padEnd(10)} ${user.email}`);
  }
  console.log(`Password for every user: ${DEVELOPMENT_PASSWORD}`);
} finally {
  await prisma.$disconnect();
}
