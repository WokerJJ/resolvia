import type { Role, User } from '../users/user.types.js';

/** Claims inside the access token. organizationId scopes every request (ADR 0005). */
export interface JwtPayload {
  sub: string; // user id
  organizationId: string;
  role: Role;
}

export interface AuthResult {
  accessToken: string;
  tokenType: 'Bearer';
  user: User;
}

export interface RegisterInput {
  organizationSlug: string;
  email: string;
  name: string;
  password: string;
}

/** Same error for "unknown email" and "wrong password": it does not reveal which one. */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

/** The caller of a request, taken from a valid access token (no database hit). */
export interface AuthenticatedUser {
  id: string;
  organizationId: string;
  role: Role;
}
