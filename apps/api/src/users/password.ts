import bcrypt from 'bcrypt';

/** bcrypt cost factor: each +1 doubles the time needed to compute (and to brute-force) a hash. */
const BCRYPT_ROUNDS = 10;

/**
 * Hashes a plain-text password with bcrypt. Shared by UsersService and the
 * development seed, so every stored hash uses the same cost factor.
 */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}
