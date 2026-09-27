import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  DEVELOPMENT_PASSWORD,
  type DevelopmentSeedOptions,
  seedDevelopmentData,
} from '../prisma/seed/development-data.js';
import { OrganizationContext } from '../src/organizations/organization-context.js';
import { slugify } from '../src/organizations/organizations.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp } from './utils/create-test-app.js';

describe('Development seed (e2e)', () => {
  const prefix = 'seed-e2e-';
  const options: DevelopmentSeedOptions = {
    organizationName: `${prefix}${randomUUID()}`,
    emailDomain: `${prefix}${randomUUID()}.test`,
  };
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let context: OrganizationContext;
  let organizationId: string;

  /** Rows of the seeded organization, read inside its scope. */
  const countRows = () =>
    context.runForOrganization(organizationId, async () => ({
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      slaPolicies: await prisma.slaPolicy.count(),
    }));

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    context = app.get(OrganizationContext);

    const result = await seedDevelopmentData(prisma, context, options);
    organizationId = result.organization.id;
  });

  afterAll(async () => {
    if (prisma) {
      const organizations = await prisma.organization.findMany({
        where: { slug: { startsWith: prefix } },
        select: { id: true },
      });
      const ids = organizations.map(({ id }) => id);
      await context.runAsSystem(async () => {
        await prisma.user.deleteMany({
          where: { organizationId: { in: ids } },
        });
        await prisma.category.deleteMany({
          where: { organizationId: { in: ids } },
        });
        await prisma.slaPolicy.deleteMany({
          where: { organizationId: { in: ids } },
        });
      });
      await prisma.organization.deleteMany({ where: { id: { in: ids } } });
    }
    await app?.close();
  });

  it('creates one user per role, the base categories and one SLA per priority', async () => {
    await expect(countRows()).resolves.toEqual({
      users: 3,
      categories: 7,
      slaPolicies: 4,
    });
  });

  it('can run again without duplicating anything', async () => {
    const again = await seedDevelopmentData(prisma, context, options);

    expect(again.organization.id).toBe(organizationId);
    await expect(countRows()).resolves.toEqual({
      users: 3,
      categories: 7,
      slaPolicies: 4,
    });
  });

  it('refuses an organization that already has other users and changes nothing', async () => {
    // A real installation: its organization already exists with its own users.
    const name = `${prefix}${randomUUID()}`;
    const realOrganization = await prisma.organization.create({
      data: { name, slug: slugify(name) },
    });
    await context.runForOrganization(realOrganization.id, () =>
      prisma.user.create({
        data: {
          organizationId: realOrganization.id,
          email: `${prefix}${randomUUID()}@real.test`,
          name: 'Real user',
          passwordHash: 'not-a-real-hash',
        },
      }),
    );

    await expect(
      seedDevelopmentData(prisma, context, {
        organizationName: name,
        emailDomain: `${prefix}${randomUUID()}.test`,
      }),
    ).rejects.toThrow(/already has users/);

    await expect(
      context.runForOrganization(realOrganization.id, async () => ({
        users: await prisma.user.count(),
        categories: await prisma.category.count(),
        slaPolicies: await prisma.slaPolicy.count(),
      })),
    ).resolves.toEqual({ users: 1, categories: 0, slaPolicies: 0 });
  });

  it.each([
    ['admin', 'ADMIN'],
    ['tecnico', 'TECHNICIAN'],
    ['usuario', 'USER'],
  ])(
    'lets %s sign in with the development password',
    async (localPart, role) => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: `${localPart}@${options.emailDomain}`,
          password: DEVELOPMENT_PASSWORD,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        user: { organizationId, role },
      });
    },
  );
});
