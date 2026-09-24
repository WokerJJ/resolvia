import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { HealthRepository } from '../src/health/health.repository.js';
import { createTestApp } from './utils/create-test-app.js';

describe('Health (e2e)', () => {
  describe('with the database up', () => {
    let app: INestApplication<App>;

    beforeAll(async () => {
      app = await createTestApp();
    });

    afterAll(async () => {
      await app.close();
    });

    it('GET /api/health returns 200 with the status', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect({ status: 'ok', database: 'up' });
    });

    it('routes are served only under the /api prefix', () => {
      return request(app.getHttpServer()).get('/health').expect(404);
    });

    it('allows CORS requests from the configured web origin', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .set('Origin', 'http://localhost:5173')
        .expect('Access-Control-Allow-Origin', 'http://localhost:5173');
    });

    it('does not allow CORS requests from other origins', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .set('Origin', 'https://evil.example.com');

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('serves the OpenAPI document at /api/docs-json', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      const document = response.body as {
        info: { title: string };
        paths: Record<string, unknown>;
      };
      expect(document.info.title).toBe('Resolvia API');
      expect(document.paths).toHaveProperty('/api/health');
    });
  });

  describe('with the database down', () => {
    let app: INestApplication<App>;

    beforeAll(async () => {
      app = await createTestApp((builder) =>
        builder
          .overrideProvider(HealthRepository)
          .useValue({ isDatabaseUp: () => Promise.resolve(false) }),
      );
    });

    afterAll(async () => {
      await app.close();
    });

    it('GET /api/health returns 503', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(503)
        .expect((response) => {
          expect(response.body).toMatchObject({
            status: 'error',
            database: 'down',
          });
        });
    });
  });
});
