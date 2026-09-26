import { randomUUID } from 'node:crypto';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { validateEnv } from '../src/config/env.validation.js';
import { OrganizationContext } from '../src/organizations/organization-context.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { Role } from '../src/users/user.types.js';
import { EmailAlreadyInUseError } from '../src/users/users.errors.js';
import { PrismaUsersRepository } from '../src/users/users.repository.js';

// Integration test against the real database: it checks what a mock cannot,
// such as the unique index on email and which columns are returned.
describe('PrismaUsersRepository (integration)', () => {
  const prefix = 'users-repository-test-';
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let context: OrganizationContext;
  let repository: PrismaUsersRepository;
  let organizationId: string;
  let otherOrganizationId: string;

  const newUserData = () => ({
    organizationId,
    email: `${prefix}${randomUUID()}@example.com`,
    name: 'Test User',
    passwordHash: 'not-a-real-hash',
  });

  /** Users are scoped by organization, so every call runs inside one. */
  const inOrganization = <T>(fn: () => Promise<T>, id = organizationId) =>
    context.runForOrganization(id, fn);

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
      providers: [PrismaUsersRepository],
    }).compile();
    await moduleRef.init();

    prisma = moduleRef.get(PrismaService);
    context = moduleRef.get(OrganizationContext);
    repository = moduleRef.get(PrismaUsersRepository);

    const newOrganization = () =>
      prisma.organization.create({
        data: { name: 'Test Org', slug: `${prefix}${randomUUID()}` },
      });
    organizationId = (await newOrganization()).id;
    otherOrganizationId = (await newOrganization()).id;
  });

  afterAll(async () => {
    await context.runAsSystem(() =>
      prisma.user.deleteMany({ where: { email: { startsWith: prefix } } }),
    );
    await prisma.organization.deleteMany({
      where: { slug: { startsWith: prefix } },
    });
    await moduleRef.close();
  });

  it('creates a user with the default role and never returns the password hash', async () => {
    const data = newUserData();

    const user = await inOrganization(() => repository.create(data));

    expect(user).toMatchObject({
      organizationId,
      email: data.email,
      name: data.name,
      role: Role.User,
    });
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('throws EmailAlreadyInUseError when the email is taken', async () => {
    const data = newUserData();
    await inOrganization(() => repository.create(data));

    await expect(
      inOrganization(() => repository.create(data)),
    ).rejects.toBeInstanceOf(EmailAlreadyInUseError);
  });

  it('finds users by id and by email without the password hash', async () => {
    const created = await inOrganization(() =>
      repository.create(newUserData()),
    );

    const byId = await inOrganization(() => repository.findById(created.id));
    const byEmail = await inOrganization(() =>
      repository.findByEmail(created.email),
    );

    expect(byId).toEqual(created);
    expect(byEmail).toEqual(created);
    expect(byId).not.toHaveProperty('passwordHash');
  });

  it('returns the password hash only through findCredentialsByEmail', async () => {
    const data = newUserData();
    const created = await inOrganization(() => repository.create(data));

    const credentials = await context.runAsSystem(() =>
      repository.findCredentialsByEmail(data.email),
    );

    expect(credentials).toEqual({
      user: created,
      passwordHash: data.passwordHash,
    });
    expect(credentials?.user).not.toHaveProperty('passwordHash');
  });

  it('returns null when the user does not exist', async () => {
    await expect(
      inOrganization(() => repository.findById(randomUUID())),
    ).resolves.toBeNull();
    await expect(
      inOrganization(() =>
        repository.findByEmail(`${prefix}missing@example.com`),
      ),
    ).resolves.toBeNull();
  });

  it('does not find users of another organization', async () => {
    const created = await inOrganization(() =>
      repository.create(newUserData()),
    );

    await expect(
      inOrganization(
        () => repository.findById(created.id),
        otherOrganizationId,
      ),
    ).resolves.toBeNull();
  });

  it('keeps the email unique across organizations', async () => {
    const data = newUserData();
    await inOrganization(() => repository.create(data));

    // The email decides the organization at login, so it is unique globally.
    await expect(
      inOrganization(
        () =>
          repository.create({ ...data, organizationId: otherOrganizationId }),
        otherOrganizationId,
      ),
    ).rejects.toBeInstanceOf(EmailAlreadyInUseError);
  });
});
