/**
 * Domain types for users. They do not import Prisma's generated types, so the
 * rest of the app does not depend on the ORM; the values match the database
 * enum, so the repository needs no conversion.
 */
export const Role = {
  User: 'USER',
  Technician: 'TECHNICIAN',
  Admin: 'ADMIN',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

/** A user as the rest of the app sees it: never includes the password hash. */
export interface User {
  id: string;
  /** Each user belongs to exactly one organization (ADR 0005). */
  organizationId: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

/** A user together with its password hash. Never leaves the users module. */
export interface UserCredentials {
  user: User;
  passwordHash: string;
}

/** Data the repository needs to store a new user (password already hashed). */
export interface CreateUserData {
  organizationId: string;
  email: string;
  name: string;
  passwordHash: string;
  role?: Role;
}
