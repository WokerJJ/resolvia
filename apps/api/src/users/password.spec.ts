import bcrypt from 'bcrypt';
import { hashPassword } from './password.js';

describe('hashPassword', () => {
  it('returns a bcrypt hash that matches the original password', async () => {
    const hash = await hashPassword('secret-password');

    expect(hash).not.toBe('secret-password');
    await expect(bcrypt.compare('secret-password', hash)).resolves.toBe(true);
    await expect(bcrypt.compare('other-password', hash)).resolves.toBe(false);
  });

  it('uses a cost factor of 10', async () => {
    const hash = await hashPassword('secret-password');

    expect(bcrypt.getRounds(hash)).toBe(10);
  });

  it('salts each hash, so the same password gives different hashes', async () => {
    await expect(hashPassword('secret-password')).resolves.not.toBe(
      await hashPassword('secret-password'),
    );
  });
});
