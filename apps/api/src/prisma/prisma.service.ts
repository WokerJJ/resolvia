import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import type { EnvironmentVariables } from '../config/env.validation.js';
import { PrismaClient } from '../generated/prisma/client.js';
import type { OrganizationContext } from '../organizations/organization-context.js';
import { organizationScope } from './organization-scope.js';

/**
 * Injection token and type of the app's Prisma client. Only repositories
 * should inject it; services depend on repositories, never on Prisma.
 *
 * The real instance is a client extended with organizationScope (see
 * createPrismaService), so every query is filtered by organization.
 */
export abstract class PrismaService extends PrismaClient {}

export function createPrismaService(
  config: ConfigService<EnvironmentVariables, true>,
  context: OrganizationContext,
): PrismaService {
  // Prisma 7 connects through a driver adapter instead of its own engine.
  const client = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: config.get('DATABASE_URL', { infer: true }),
    }),
  });

  // Query extensions change behavior, not types: the extended client exposes
  // the same API as PrismaClient, so the cast is safe.
  return client.$extends(
    organizationScope(context),
  ) as unknown as PrismaService;
}
