import { type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { OrganizationContext } from '../../organizations/organization-context.js';
import type { AuthenticatedUser } from '../auth.types.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

/**
 * Global guard: every endpoint requires a valid access token unless it is
 * marked with @Public(). On success it scopes the request to the organization
 * in the token, so every query that follows is filtered by it (ADR 0005).
 *
 * Depends on the middleware registered in configureApp (app.setup.ts), which
 * opens a fresh organization scope for each request: without it,
 * setOrganizationId throws MissingOrganizationContextError. Any app or test that
 * skips configureApp must open that scope itself.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly organizationContext: OrganizationContext,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // Throws 401 if the token is missing, invalid or expired.
    const allowed = await (super.canActivate(context) as Promise<boolean>);

    const { user } = context
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();
    this.organizationContext.setOrganizationId(user.organizationId);

    return allowed;
  }
}
