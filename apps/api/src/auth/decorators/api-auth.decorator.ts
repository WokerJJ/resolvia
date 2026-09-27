import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

/**
 * Documents in Swagger that an endpoint (or every endpoint of a controller)
 * requires a token. It does not protect anything by itself: JwtAuthGuard
 * already closes every route that is not @Public(); this only makes the docs
 * say so. The swagger e2e test fails if a protected operation lacks it.
 */
export const ApiAuth = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Missing, invalid or expired token',
    }),
  );
