import { randomUUID } from 'node:crypto';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { validateEnv } from '../src/config/env.validation.js';
import { OrganizationSlugInUseError } from '../src/organizations/organizations.errors.js';
import { PrismaOrganizationsRepository } from '../src/organizations/organizations.repository.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// Integration test against the real database: it checks the unique index on
// slug, which a mock cannot.
describe('PrismaOrganizationsRepository (integration)', () => {
  const slugPrefix = 'organizations-repository-test-';
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let repository: PrismaOrganizationsRepository;

  const newOrganizationData = () => ({
    name: 'Test Organization',
    slug: `${slugPrefix}${randomUUID()}`,
  });

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
      providers: [PrismaOrganizationsRepository],
    }).compile();
    await moduleRef.init();

    prisma = moduleRef.get(PrismaService);
    repository = moduleRef.get(PrismaOrganizationsRepository);
  });

  afterAll(async () => {
    await prisma.organization.deleteMany({
      where: { slug: { startsWith: slugPrefix } },
    });
    await moduleRef.close();
  });

  it('creates an organization', async () => {
    const data = newOrganizationData();

    const organization = await repository.create(data);

    expect(organization).toMatchObject(data);
    expect(organization.id).toEqual(expect.any(String));
  });

  it('throws OrganizationSlugInUseError when the slug is taken', async () => {
    const data = newOrganizationData();
    await repository.create(data);

    await expect(
      repository.create({ ...data, name: 'Another name' }),
    ).rejects.toBeInstanceOf(OrganizationSlugInUseError);
  });

  it('finds organizations by id and by slug', async () => {
    const created = await repository.create(newOrganizationData());

    await expect(repository.findById(created.id)).resolves.toEqual(created);
    await expect(repository.findBySlug(created.slug)).resolves.toEqual(created);
  });

  it('returns null when the organization does not exist', async () => {
    await expect(repository.findById(randomUUID())).resolves.toBeNull();
    await expect(
      repository.findBySlug(`${slugPrefix}missing`),
    ).resolves.toBeNull();
  });
});
