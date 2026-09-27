import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Opens an endpoint to unauthenticated callers. Every other endpoint requires
 * a valid token, so forgetting an annotation leaves it closed, not open.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
