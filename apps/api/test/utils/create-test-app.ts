import type { INestApplication, Type } from '@nestjs/common';
import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';

/**
 * Builds the full application with the same HTTP configuration as main.ts.
 * `override` lets a test replace providers (for example, simulate a database
 * outage); `controllers` mounts test-only endpoints (for example, to probe guards).
 */
export async function createTestApp(
  override?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
  controllers: Type[] = [],
): Promise<INestApplication> {
  const builder = Test.createTestingModule({
    imports: [AppModule],
    controllers,
  });
  const moduleRef = await (override ? override(builder) : builder).compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();

  return app;
}
