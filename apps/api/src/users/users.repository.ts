import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateUserData, User } from './user.types.js';
import { EmailAlreadyInUseError } from './users.errors.js';

/**
 * Contract used by UsersService. Abstract class instead of interface so Nest
 * can use it as an injection token (interfaces disappear at runtime).
 */
export abstract class UsersRepository {
  /** @throws EmailAlreadyInUseError if the email is already registered. */
  abstract create(data: CreateUserData): Promise<User>;
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
}

/** Columns returned to the app: everything except passwordHash. */
const publicUserFields = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserData): Promise<User> {
    try {
      return await this.prisma.user.create({
        data,
        select: publicUserFields,
      });
    } catch (error) {
      // The unique index on email is the real guarantee: two concurrent sign-ups
      // can both pass a "does it exist?" check, but only one insert succeeds.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new EmailAlreadyInUseError(data.email);
      }
      throw error;
    }
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: publicUserFields,
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: publicUserFields,
    });
  }
}
