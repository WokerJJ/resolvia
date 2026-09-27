import { assertDevelopmentSeedAllowed } from './development-seed-guard.js';

describe('assertDevelopmentSeedAllowed', () => {
  it('refuses to run when ALLOW_DEV_SEED is not set', () => {
    expect(() => assertDevelopmentSeedAllowed({})).toThrow(/ALLOW_DEV_SEED/);
  });

  it.each(['1', 'yes', 'TRUE', ' true', 'false', ''])(
    'refuses to run when ALLOW_DEV_SEED is "%s"',
    (value) => {
      expect(() =>
        assertDevelopmentSeedAllowed({ ALLOW_DEV_SEED: value }),
      ).toThrow(/ALLOW_DEV_SEED/);
    },
  );

  it('runs when ALLOW_DEV_SEED is exactly "true"', () => {
    expect(() =>
      assertDevelopmentSeedAllowed({ ALLOW_DEV_SEED: 'true' }),
    ).not.toThrow();
  });

  it('refuses to run with NODE_ENV=production even if ALLOW_DEV_SEED is "true"', () => {
    expect(() =>
      assertDevelopmentSeedAllowed({
        ALLOW_DEV_SEED: 'true',
        NODE_ENV: 'production',
      }),
    ).toThrow(/NODE_ENV=production/);
  });
});
