import {
  createParamDecorator,
  type ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth.types.js';

/**
 * Injects the caller of the request, as validated by JwtAuthGuard. On a route
 * without authentication (for example, a @Public() one) there is no caller, so
 * it fails loudly instead of handing the handler an `undefined` user.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    if (!user) {
      throw new InternalServerErrorException(
        '@CurrentUser() used on a route without authentication',
      );
    }
    return user;
  },
);
