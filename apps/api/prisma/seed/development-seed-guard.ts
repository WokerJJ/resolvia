/**
 * The development seed creates an ADMIN whose password is public, so it needs
 * an explicit opt-in: ALLOW_DEV_SEED must be exactly "true". NODE_ENV is not
 * enough on its own because nothing in the project sets it; it only works as
 * an extra veto.
 *
 * @throws Error explaining why the seed must not run.
 */
export function assertDevelopmentSeedAllowed(env: NodeJS.ProcessEnv): void {
  if (env.ALLOW_DEV_SEED !== 'true') {
    throw new Error(
      'The development seed creates users with a public password. ' +
        'Set ALLOW_DEV_SEED=true in .env to run it (development only, never in a real installation).',
    );
  }

  if (env.NODE_ENV === 'production') {
    throw new Error(
      'The development seed does not run with NODE_ENV=production, even with ALLOW_DEV_SEED=true.',
    );
  }
}
