import { randomUUID } from 'node:crypto';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { validateEnv } from '../src/config/env.validation.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { Role } from '../src/users/user.types.js';
import { EmailAlreadyInUseError } from '../src/users/users.errors.js';
import { PrismaUsersRepository } from '../src/users/users.repository.js';

// Integration test against the real database: it checks what a mock cannot,
// such as the unique index on email and which columns are returned.
describe('PrismaUsersRepository (integration)', () => {
  const emailPrefix = 'users-repository-test-';
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let repository: PrismaUsersRepository;
  let organizationId: string;

  const newUserData = () => ({
    organizationId,
    email: `${emailPrefix}${randomUUID()}@example.com`,
    name: 'Test User',
    passwordHash: 'not-a-real-hash',
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
      providers: [PrismaUsersRepository],
    }).compile();
    await moduleRef.init();

    prisma = moduleRef.get(PrismaService);
    repository = moduleRef.get(PrismaUsersRepository);

    const organization = await prisma.organization.create({
      data: { name: 'Test Org', slug: `${emailPrefix}${randomUUID()}` },
    });
    organizationId = organization.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { startsWith: emailPrefix } },
    });
    await prisma.organization.delete({ where: { id: organizationId } });
    await moduleRef.close();
  });

  it('creates a user with the default role and never returns the password hash', async () => {
    const data = newUserData();

    const user = await repository.create(data);

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
    await repository.create(data);

    await expect(repository.create(data)).rejects.toBeInstanceOf(
      EmailAlreadyInUseError,
    );
  });

  it('finds users by id and by email without the password hash', async () => {
    const created = await repository.create(newUserData());

    const byId = await repository.findById(created.id);
    const byEmail = await repository.findByEmail(created.email);

    expect(byId).toEqual(created);
    expect(byEmail).toEqual(created);
    expect(byId).not.toHaveProperty('passwordHash');
  });

  it('returns null when the user does not exist', async () => {
    await expect(repository.findById(randomUUID())).resolves.toBeNull();
    await expect(
      repository.findByEmail(`${emailPrefix}missing@example.com`),
    ).resolves.toBeNull();
  });
});
