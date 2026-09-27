import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  DeploymentMode,
  type EnvironmentVariables,
  validateEnv,
} from '../src/config/env.validation.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { InitialOrganizationBootstrap } from '../src/organizations/initial-organization.bootstrap.js';
import { PrismaOrganizationsRepository } from '../src/organizations/organizations.repository.js';
import { OrganizationsService } from '../src/organizations/organizations.service.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// The shared database always has organizations (other suites, the seed, the
// developer's data), so "an installation without organizations" cannot be
// observed there. Each run gets its own PostgreSQL schema with an empty copy
// of the Organization table, and a client pointed at it: real SQL against the
// real table definition, without touching anyone else's rows.
describe('Initial organization on an empty installation (integration)', () => {
  const schema = `initial_organization_${randomUUID().replaceAll('-', '')}`;
  const organizationName = 'Colegio San José';
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let emptyInstallation: PrismaClient;
  let repository: PrismaOrganizationsRepository;
  let bootstrap: InitialOrganizationBootstrap;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env', '../../.env'],
          validate: validateEnv,
        }),
        PrismaModule,
      ],
    }).compile();
    await moduleRef.init();
    prisma = moduleRef.get(PrismaService);

    // The migrations create the tables in "public" (DATABASE_URL uses schema=public).
    await prisma.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    await prisma.$executeRawUnsafe(
      `CREATE TABLE "${schema}"."Organization" (LIKE public."Organization" INCLUDING ALL)`,
    );

    const databaseUrl = moduleRef
      .get(ConfigService<EnvironmentVariables, true>)
      .get('DATABASE_URL', { infer: true });
    emptyInstallation = new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl }, { schema }),
    });
    // The repository only needs the Organization delegate, which both clients share.
    repository = new PrismaOrganizationsRepository(
      emptyInstallation as unknown as PrismaService,
    );

    const env: Partial<EnvironmentVariables> = {
      DEPLOYMENT_MODE: DeploymentMode.OnPrem,
      DEFAULT_ORG_NAME: organizationName,
    };
    const config = {
      get: (key: keyof EnvironmentVariables) => env[key],
    } as unknown as ConfigService<EnvironmentVariables, true>;
    bootstrap = new InitialOrganizationBootstrap(
      config,
      new OrganizationsService(repository),
    );
  });

  afterAll(async () => {
    await emptyInstallation?.$disconnect();
    await prisma?.$executeRawUnsafe(
      `DROP SCHEMA IF EXISTS "${schema}" CASCADE`,
    );
    await moduleRef?.close();
  });

  it('reports that a new installation has no organizations', async () => {
    await expect(repository.hasAny()).resolves.toBe(false);
  });

  it('creates DEFAULT_ORG_NAME on the first on-premise start', async () => {
    await bootstrap.onApplicationBootstrap();

    await expect(repository.hasAny()).resolves.toBe(true);
    await expect(
      emptyInstallation.organization.findMany({
        select: { name: true, slug: true },
      }),
    ).resolves.toEqual([{ name: organizationName, slug: 'colegio-san-jose' }]);
  });

  it('does not create another organization on the next starts', async () => {
    await bootstrap.onApplicationBootstrap();

    await expect(emptyInstallation.organization.count()).resolves.toBe(1);
  });
});
