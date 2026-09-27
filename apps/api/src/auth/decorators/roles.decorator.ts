import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiForbiddenResponse } from '@nestjs/swagger';
import type { Role } from '../../users/user.types.js';

export const ROLES_KEY = 'roles';

/**
 * Restricts an endpoint to the given roles, and documents the resulting 403 in
 * Swagger. Without it, any signed-in user may call it.
 */
export const Roles = (...roles: Role[]) =>
  applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    ApiForbiddenResponse({
      description: `Requires one of these roles: ${roles.join(', ')}`,
    }),
  );
