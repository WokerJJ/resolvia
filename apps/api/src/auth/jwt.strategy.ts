import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { EnvironmentVariables } from '../config/env.validation.js';
import { OrganizationContext } from '../organizations/organization-context.js';
import { UsersService } from '../users/users.service.js';
import type { AuthenticatedUser, JwtPayload } from './auth.types.js';

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

/**
 * Validates the "Authorization: Bearer <token>" header. Passport checks the
 * signature and expiration; validate() checks the claims and loads the user.
 *
 * The token only proves who the caller was when it was issued. The user is
 * read from the database on every request, so deleting a user or changing
 * their role takes effect immediately instead of when the token expires
 * (ADR 0012, BUG-001). The role claim is informative and never trusted.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService<EnvironmentVariables, true>,
    private readonly usersService: UsersService,
    private readonly organizationContext: OrganizationContext,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET', { infer: true }),
      ignoreExpiration: false,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: Partial<JwtPayload>): Promise<AuthenticatedUser> {
    const { sub, organizationId } = payload;
    if (!isNonEmptyString(sub) || !isNonEmptyString(organizationId)) {
      throw new UnauthorizedException('Invalid token');
    }

    // Looked up inside the token's organization: a user of another
    // organization is not found, so a token cannot cross organizations.
    const user = await this.organizationContext.runForOrganization(
      organizationId,
      () => this.usersService.findById(sub),
    );
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    return {
      id: user.id,
      organizationId: user.organizationId,
      role: user.role,
    };
  }
}
