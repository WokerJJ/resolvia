import { JwtService } from '@nestjs/jwt';
import { OrganizationContext } from '../organizations/organization-context.js';
import type { Organization } from '../organizations/organization.types.js';
import { OrganizationNotFoundError } from '../organizations/organizations.errors.js';
import { OrganizationsService } from '../organizations/organizations.service.js';
import { Role, type User } from '../users/user.types.js';
import { EmailAlreadyInUseError } from '../users/users.errors.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { InvalidCredentialsError, type JwtPayload } from './auth.types.js';

describe('AuthService', () => {
  const organization: Organization = {
    id: 'org-1',
    name: 'Colegio Central',
    slug: 'colegio-central',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const user: User = {
    id: 'user-1',
    organizationId: organization.id,
    email: 'ana@example.com',
    name: 'Ana',
    role: Role.User,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const registerInput = {
    organizationSlug: organization.slug,
    email: user.email,
    name: user.name,
    password: 'una-contraseña-larga',
  };

  const usersService = {
    create: vi.fn<UsersService['create']>(),
    verifyCredentials: vi.fn<UsersService['verifyCredentials']>(),
  };
  const organizationsService = {
    findBySlug: vi.fn<OrganizationsService['findBySlug']>(),
  };
  const context = new OrganizationContext();
  const jwtService = new JwtService({ secret: 'a'.repeat(32) });
  const service = new AuthService(
    usersService as unknown as UsersService,
    organizationsService as unknown as OrganizationsService,
    context,
    jwtService,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    organizationsService.findBySlug.mockResolvedValue(organization);
    usersService.create.mockResolvedValue(user);
    usersService.verifyCredentials.mockResolvedValue(user);
  });

  describe('register', () => {
    it('creates the user inside the organization of the slug', async () => {
      let scopeDuringCreate: string | undefined;
      usersService.create.mockImplementation(() => {
        scopeDuringCreate = context.current()?.organizationId;
        return Promise.resolve(user);
      });

      await service.register(registerInput);

      expect(usersService.create).toHaveBeenCalledWith({
        organizationId: organization.id,
        email: registerInput.email,
        name: registerInput.name,
        password: registerInput.password,
      });
      expect(scopeDuringCreate).toBe(organization.id);
    });

    it('returns a token with the user, organization and role', async () => {
      const result = await service.register(registerInput);

      expect(result.tokenType).toBe('Bearer');
      expect(result.user).toBe(user);
      await expect(
        jwtService.verifyAsync<JwtPayload>(result.accessToken),
      ).resolves.toMatchObject({
        sub: user.id,
        organizationId: organization.id,
        role: Role.User,
      });
    });

    it('throws OrganizationNotFoundError when the slug does not exist', async () => {
      organizationsService.findBySlug.mockResolvedValue(null);

      await expect(service.register(registerInput)).rejects.toBeInstanceOf(
        OrganizationNotFoundError,
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('lets EmailAlreadyInUseError through for the web layer', async () => {
      usersService.create.mockRejectedValue(
        new EmailAlreadyInUseError(user.email),
      );

      await expect(service.register(registerInput)).rejects.toBeInstanceOf(
        EmailAlreadyInUseError,
      );
    });
  });

  describe('login', () => {
    it('looks up the email as a system operation', async () => {
      let systemDuringLookup: boolean | undefined;
      usersService.verifyCredentials.mockImplementation(() => {
        systemDuringLookup = context.current()?.system;
        return Promise.resolve(user);
      });

      await service.login(user.email, registerInput.password);

      expect(usersService.verifyCredentials).toHaveBeenCalledWith(
        user.email,
        registerInput.password,
      );
      expect(systemDuringLookup).toBe(true);
    });

    it('returns a token with the organization of the user', async () => {
      const result = await service.login(user.email, registerInput.password);

      await expect(
        jwtService.verifyAsync<JwtPayload>(result.accessToken),
      ).resolves.toMatchObject({
        sub: user.id,
        organizationId: organization.id,
      });
    });

    it('throws InvalidCredentialsError when the credentials do not match', async () => {
      usersService.verifyCredentials.mockResolvedValue(null);

      await expect(
        service.login(user.email, 'wrong-password'),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    });
  });
});
