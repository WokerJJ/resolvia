import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import type { User } from './user.types.js';
import { UsersRepository } from './users.repository.js';
import { EmailAlreadyInUseError } from './users.errors.js';

/** bcrypt cost factor: each +1 doubles the time needed to compute (and to brute-force) a hash. */
const BCRYPT_ROUNDS = 10;

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export interface CreateUserInput {
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

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    return this.usersRepository.create({
      email,
      name: input.name,
      passwordHash,
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(normalizeEmail(email));
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }
}
