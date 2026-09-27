import { Controller, Get, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { ApiAuth } from '../src/auth/decorators/api-auth.decorator.js';
import { Roles } from '../src/auth/decorators/roles.decorator.js';
import { Role } from '../src/users/user.types.js';
import { createTestApp } from './utils/create-test-app.js';

/** Test-only endpoint to check how @Roles() shows up in the OpenAPI document. */
@ApiAuth()
@Controller('swagger-probe')
class SwaggerProbeController {
  @Get('admin')
  @Roles(Role.Admin)
  admin() {
    return { ok: true };
  }
}

interface Operation {
  security?: unknown[];
  responses: Record<string, unknown>;
}
type OpenApiDocument = {
  paths: Record<string, Record<string, Operation>>;
};

/** Operations that are @Public(); every other one requires a token. */
const PUBLIC_OPERATIONS = [
  'get /api/health',
  'post /api/auth/register',
  'post /api/auth/login',
];

describe('Swagger document (e2e)', () => {
  let app: INestApplication<App>;
  let operations: Map<string, Operation>;

  beforeAll(async () => {
    app = await createTestApp(undefined, [SwaggerProbeController]);

    const response = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);
    const document = response.body as OpenApiDocument;
    operations = new Map(
      Object.entries(document.paths).flatMap(([path, methods]) =>
        Object.entries(methods).map(
          ([method, operation]) => [`${method} ${path}`, operation] as const,
        ),
      ),
    );
  });

  afterAll(async () => {
    await app?.close();
  });

  it('declares bearer security and a 401 on every protected operation', () => {
    const protectedOperations = [...operations].filter(
      ([key]) => !PUBLIC_OPERATIONS.includes(key),
    );

    expect(protectedOperations.length).toBeGreaterThan(0);
    for (const [key, operation] of protectedOperations) {
      expect(operation.security, key).toEqual([{ bearer: [] }]);
      expect(operation.responses, key).toHaveProperty('401');
    }
  });

  it('does not declare security on public operations', () => {
    for (const key of PUBLIC_OPERATIONS) {
      expect(operations.get(key), key).toBeDefined();
      expect(operations.get(key)?.security, key).toBeUndefined();
    }
  });

  it('documents the 403 of @Roles()', () => {
    const operation = operations.get('get /api/swagger-probe/admin');

    expect(operation?.responses).toHaveProperty('403');
  });
});
