import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../users/user.types.js';
import type { AuthenticatedUser } from '../auth.types.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { RolesGuard } from './roles.guard.js';

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  /** Builds an execution context for a handler with the given @Roles metadata. */
  const contextFor = (roles: Role[] | undefined, user?: AuthenticatedUser) => {
    const handler = () => undefined;
    if (roles) Reflect.defineMetadata(ROLES_KEY, roles, handler);
    return {
      getHandler: () => handler,
      getClass: () => class {},
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  };
  const userWith = (role: Role): AuthenticatedUser => ({
    id: 'user-1',
    organizationId: 'org-1',
    role,
  });

  it('allows any signed-in user when there is no @Roles', () => {
    expect(guard.canActivate(contextFor(undefined, userWith(Role.User)))).toBe(
      true,
    );
  });

  it('allows a user whose role is listed', () => {
    expect(
      guard.canActivate(
        contextFor([Role.Technician, Role.Admin], userWith(Role.Admin)),
      ),
    ).toBe(true);
  });

  it('throws 403 when the role is not listed', () => {
    expect(() =>
      guard.canActivate(contextFor([Role.Admin], userWith(Role.User))),
    ).toThrow(ForbiddenException);
  });

  it('throws 403 when there is no user on the request', () => {
    expect(() => guard.canActivate(contextFor([Role.Admin]))).toThrow(
      ForbiddenException,
    );
  });
});
