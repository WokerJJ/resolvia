import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../config/env.validation.js';
import { OrganizationContext } from '../organizations/organization-context.js';
import { Role, type User } from '../users/user.types.js';
import type { UsersService } from '../users/users.service.js';
import { JwtStrategy } from './jwt.strategy.js';

describe('JwtStrategy.validate', () => {
  const config = {
    get: () => 'a'.repeat(32),
  } as unknown as ConfigService<EnvironmentVariables, true>;
  const user: User = {
    id: 'user-1',
    organizationId: 'org-1',
    email: 'ana@example.com',
    name: 'Ana',
    role: Role.User,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const organizationContext = new OrganizationContext();
  const usersService = { findById: vi.fn<UsersService['findById']>() };
  const strategy = new JwtStrategy(
    config,
    usersService as unknown as UsersService,
    organizationContext,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    usersService.findById.mockResolvedValue(user);
  });

  it('returns the user with the role stored in the database, not the one in the token', async () => {
    await expect(
      strategy.validate({
        sub: 'user-1',
        organizationId: 'org-1',
        role: Role.Admin,
      }),
    ).resolves.toEqual({ id: 'user-1', organizationId: 'org-1', role: 'USER' });
  });

  it('looks the user up inside the organization of the token', async () => {
    let scope: ReturnType<OrganizationContext['current']>;
    usersService.findById.mockImplementation((id) => {
      scope = organizationContext.current();
      return Promise.resolve({ ...user, id });
    });

    await strategy.validate({ sub: 'user-1', organizationId: 'org-1' });

    expect(usersService.findById).toHaveBeenCalledWith('user-1');
    expect(scope).toEqual({ organizationId: 'org-1', system: false });
  });

  it('rejects a token whose user no longer exists', async () => {
    usersService.findById.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: 'user-1', organizationId: 'org-1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it.each([
    ['without sub', { organizationId: 'org-1' }],
    ['without organizationId', { sub: 'user-1' }],
    ['with a non-string sub', { sub: 42, organizationId: 'org-1' }],
  ])('rejects a token %s without querying the database', async (_, payload) => {
    await expect(
      strategy.validate(payload as Parameters<JwtStrategy['validate']>[0]),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(usersService.findById).not.toHaveBeenCalled();
  });
});
