import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { normalizeEmail } from './email.js';
import { hashPassword } from './password.js';
import type { User } from './user.types.js';
import { UsersRepository } from './users.repository.js';
import { EmailAlreadyInUseError } from './users.errors.js';

/**
 * Hash compared when the email does not exist, so a failed login takes about
 * the same time whether or not the account exists (prevents user enumeration).
 */
let dummyHash: string | undefined;
const getDummyHash = async (): Promise<string> =>
  (dummyHash ??= await hashPassword('resolvia-timing-guard'));

export interface CreateUserInput {
  organizationId: string;
  email: string;
  name: string;
  password: string; // plain text: it must never reach the repository
}

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(input: CreateUserInput): Promise<User> {
    const email = normalizeEmail(input.email);
    const existingUser = await this.usersRepository.findByEmail(email);

    if (existingUser) {
      throw new EmailAlreadyInUseError(email);
    }

    const passwordHash = await hashPassword(input.password);
    return this.usersRepository.create({
      organizationId: input.organizationId,
      email,
      name: input.name,
      passwordHash,
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(normalizeEmail(email));
  }

  /**
   * Returns the user if the password matches, or null otherwise. The password
   * hash never leaves this module.
   */
  async verifyCredentials(
    email: string,
    password: string,
  ): Promise<User | null> {
    const credentials = await this.usersRepository.findCredentialsByEmail(
      normalizeEmail(email),
    );

    const matches = await bcrypt.compare(
      password,
      credentials?.passwordHash ?? (await getDummyHash()),
    );

    return credentials && matches ? credentials.user : null;
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }
}
