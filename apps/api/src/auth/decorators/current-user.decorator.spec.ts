import {
  type ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants.js';
import { Role } from '../../users/user.types.js';
import type { AuthenticatedUser } from '../auth.types.js';
import { CurrentUser } from './current-user.decorator.js';

type ParamFactory = (data: unknown, context: ExecutionContext) => unknown;

/** Extracts the factory that Nest runs for @CurrentUser() on a handler. */
function currentUserFactory(): ParamFactory {
  class Probe {
    handler(@CurrentUser() _user: AuthenticatedUser) {}
  }
  const args = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    Probe,
    'handler',
  ) as Record<string, { factory: ParamFactory }>;
  return Object.values(args)[0].factory;
}

describe('@CurrentUser()', () => {
  const factory = currentUserFactory();
  const contextWith = (user?: AuthenticatedUser) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  it('returns the user set by JwtAuthGuard', () => {
    const user: AuthenticatedUser = {
      id: 'user-1',
      organizationId: 'org-1',
      role: Role.User,
    };

    expect(factory(undefined, contextWith(user))).toBe(user);
  });

  it('fails loudly on a route without authentication, such as a @Public() one', () => {
    expect(() => factory(undefined, contextWith())).toThrow(
      InternalServerErrorException,
    );
  });
});
