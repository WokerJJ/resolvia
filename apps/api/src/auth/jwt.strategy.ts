import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { EnvironmentVariables } from '../config/env.validation.js';
import { Role } from '../users/user.types.js';
import type { AuthenticatedUser, JwtPayload } from './auth.types.js';

const ROLES: readonly string[] = Object.values(Role);

/**
 * Validates the "Authorization: Bearer <token>" header. Passport checks the
 * signature and expiration; validate() checks the claims we rely on.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService<EnvironmentVariables, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET', { infer: true }),
      ignoreExpiration: false,
      algorithms: ['HS256'],
    });
  }

  validate(payload: Partial<JwtPayload>): AuthenticatedUser {
    const { sub, organizationId, role } = payload;
    if (!sub || !organizationId || !role || !ROLES.includes(role)) {
      throw new UnauthorizedException('Invalid token');
    }
    return { id: sub, organizationId, role };
  }
}
