import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../config/env.validation.js';
import { Role } from '../users/user.types.js';
import { JwtStrategy } from './jwt.strategy.js';

describe('JwtStrategy.validate', () => {
  const config = {
    get: () => 'a'.repeat(32),
  } as unknown as ConfigService<EnvironmentVariables, true>;
  const strategy = new JwtStrategy(config);

  it('maps the token claims to the authenticated user', () => {
    expect(
      strategy.validate({
        sub: 'user-1',
        organizationId: 'org-1',
        role: Role.Technician,
      }),
    ).toEqual({ id: 'user-1', organizationId: 'org-1', role: Role.Technician });
  });

  it('rejects a token without organizationId', () => {
    expect(() => strategy.validate({ sub: 'user-1', role: Role.User })).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a token with an unknown role', () => {
    expect(() =>
      strategy.validate({
        sub: 'user-1',
        organizationId: 'org-1',
        role: 'SUPERUSER' as Role,
      }),
    ).toThrow(UnauthorizedException);
  });
});
