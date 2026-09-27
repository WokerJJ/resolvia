import { SetMetadata } from '@nestjs/common';
import type { Role } from '../../users/user.types.js';

export const ROLES_KEY = 'roles';

/** Restricts an endpoint to the given roles. Without it, any signed-in user may call it. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
