import bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository.js';
import { UsersService, type CreateUserInput } from './users.service.js';
import { EmailAlreadyInUseError } from './users.errors.js';
import { Role, type User } from './user.types.js';

describe('UsersService', () => {
  const user: User = {
    id: 'user-1',
    organizationId: 'org-1',
    email: 'ana@example.com',
    name: 'Ana',
    role: Role.User,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const input: CreateUserInput = {
    organizationId: 'org-1',
    email: 'Ana@Example.com',
    name: 'Ana',
    password: 'secret-password',
  };
  const usersRepository = {
    create: vi.fn<UsersRepository['create']>(),
    findById: vi.fn<UsersRepository['findById']>(),
    findByEmail: vi.fn<UsersRepository['findByEmail']>(),
  };
  const service = new UsersService(usersRepository as UsersRepository);

  beforeEach(() => {
    vi.clearAllMocks();
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.create.mockResolvedValue(user);
    usersRepository.findById.mockResolvedValue(user);
  });

  describe('create', () => {
    it('hashes the password before saving', async () => {
      await service.create(input);

      const savedData = usersRepository.create.mock.calls[0]?.[0];
      expect(savedData?.passwordHash).not.toBe(input.password);
      expect(savedData).not.toHaveProperty('password');
    });

    it('stores a hash that bcrypt.compare accepts for the original password', async () => {
      await service.create(input);

      const savedData = usersRepository.create.mock.calls[0]?.[0];
      await expect(
        bcrypt.compare(input.password, savedData!.passwordHash),
      ).resolves.toBe(true);
    });

    it('normalizes the email before checking and saving', async () => {
      await service.create({ ...input, email: ' Ana@Example.com ' });

      expect(usersRepository.findByEmail).toHaveBeenCalledWith(
        'ana@example.com',
      );
      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'ana@example.com' }),
      );
    });

    it('throws EmailAlreadyInUseError when the email already exists', async () => {
      usersRepository.findByEmail.mockResolvedValue(user);

      await expect(service.create(input)).rejects.toBeInstanceOf(
        EmailAlreadyInUseError,
      );
    });

    it('does not call repository.create when the email already exists', async () => {
      usersRepository.findByEmail.mockResolvedValue(user);

      await expect(service.create(input)).rejects.toBeInstanceOf(
        EmailAlreadyInUseError,
      );
      expect(usersRepository.create).not.toHaveBeenCalled();
    });

    it('creates the user in the given organization', async () => {
      await service.create(input);

      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'org-1' }),
      );
    });

    it('returns the user created by the repository', async () => {
      await expect(service.create(input)).resolves.toBe(user);
    });
  });

  describe('findByEmail', () => {
    it('normalizes the email before searching', async () => {
      await service.findByEmail(' Ana@Example.com ');

      expect(usersRepository.findByEmail).toHaveBeenCalledWith(
        'ana@example.com',
      );
    });

    it('returns null when the user does not exist', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      await expect(service.findByEmail('missing@example.com')).resolves.toBe(
        null,
      );
    });
  });

  describe('findById', () => {
    it('returns the user found by the repository', async () => {
      await expect(service.findById(user.id)).resolves.toBe(user);
      expect(usersRepository.findById).toHaveBeenCalledWith(user.id);
    });
  });
});
