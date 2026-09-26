import { randomUUID } from 'node:crypto';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { validateEnv } from '../src/config/env.validation.js';
import {
  MissingOrganizationContextError,
  OrganizationContext,
} from '../src/organizations/organization-context.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// Isolation between organizations, against the real database (ADR 0005).
describe('Organization isolation (e2e)', () => {
  const prefix = 'isolation-test-';
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let context: OrganizationContext;
  let orgA: string;
  let orgB: string;
  let categoryB: string;

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
    context = moduleRef.get(OrganizationContext);

    // Organization is not a scoped model, so it can be created without a context.
    const newOrg = () =>
      prisma.organization.create({
        data: { name: 'Isolation test', slug: `${prefix}${randomUUID()}` },
      });
    orgA = (await newOrg()).id;
    orgB = (await newOrg()).id;

    await context.runForOrganization(orgA, () =>
      prisma.category.createMany({
        data: [
          { organizationId: orgA, name: 'Redes' },
          { organizationId: orgA, name: 'Hardware' },
        ],
      }),
    );
    categoryB = await context.runForOrganization(orgB, async () => {
      const category = await prisma.category.create({
        data: { organizationId: orgB, name: 'Redes' },
      });
      return category.id;
    });
  });

  afterAll(async () => {
    await context.runAsSystem(() =>
      prisma.category.deleteMany({
        where: { organizationId: { in: [orgA, orgB] } },
      }),
    );
    await prisma.organization.deleteMany({
      where: { slug: { startsWith: prefix } },
    });
    await moduleRef.close();
  });

  it('lists only the rows of the current organization', async () => {
    const names = await context.runForOrganization(orgA, async () =>
      (await prisma.category.findMany({ orderBy: { name: 'asc' } })).map(
        (category) => category.name,
      ),
    );

    expect(names).toEqual(['Hardware', 'Redes']);
  });

  it('does not find a row of another organization by id', async () => {
    const found = await context.runForOrganization(orgA, () =>
      prisma.category.findUnique({ where: { id: categoryB } }),
    );

    expect(found).toBeNull();
  });

  it('counts only the rows of the current organization', async () => {
    await expect(
      context.runForOrganization(orgB, () => prisma.category.count()),
    ).resolves.toBe(1);
  });

  it('does not update rows of another organization', async () => {
    const result = await context.runForOrganization(orgA, () =>
      prisma.category.updateMany({ data: { active: false } }),
    );

    expect(result.count).toBe(2);
    const categoryOfB = await context.runForOrganization(orgB, () =>
      prisma.category.findUnique({ where: { id: categoryB } }),
    );
    expect(categoryOfB?.active).toBe(true);
  });

  it('allows the same category name in different organizations', async () => {
    // "Redes" exists in both: the unique index is per organization.
    const inB = await context.runForOrganization(orgB, () =>
      prisma.category.findMany({ where: { name: 'Redes' } }),
    );

    expect(inB).toHaveLength(1);
  });

  it('refuses scoped queries without an organization in the context', async () => {
    await expect(prisma.category.findMany()).rejects.toBeInstanceOf(
      MissingOrganizationContextError,
    );
  });

  it('sees every organization in a system run', async () => {
    const total = await context.runAsSystem(() =>
      prisma.category.count({
        where: { organizationId: { in: [orgA, orgB] } },
      }),
    );

    expect(total).toBe(3);
  });
});
