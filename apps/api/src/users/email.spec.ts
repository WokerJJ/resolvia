import { normalizeEmail } from './email.js';

describe('normalizeEmail', () => {
  it('trims and lowercases the email', () => {
    expect(normalizeEmail('  Ana@Example.COM ')).toBe('ana@example.com');
  });

  it('leaves an already normalized email as it is', () => {
    expect(normalizeEmail('ana@example.com')).toBe('ana@example.com');
  });
});
