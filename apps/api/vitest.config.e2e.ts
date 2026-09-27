import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    env: {
      // In on-premise mode every app started by createTestApp would run
      // InitialOrganizationBootstrap, which creates DEFAULT_ORG_NAME in the
      // shared database whenever it is empty and nobody deletes it afterwards.
      // The bootstrap has its own tests; here the result must not depend on
      // what the database already contains. process.env wins over .env in
      // ConfigModule, so this reaches validateEnv.
      DEPLOYMENT_MODE: 'cloud',
    },
  },
});
