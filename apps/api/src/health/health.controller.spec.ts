import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

describe('HealthController', () => {
  const healthService = { check: vi.fn() };
  const controller = new HealthController(
    healthService as unknown as HealthService,
  );

  it('returns the health status when everything is up', async () => {
    healthService.check.mockResolvedValue({ status: 'ok', database: 'up' });

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
  });

  it('throws 503 when the database is down', async () => {
    healthService.check.mockResolvedValue({
      status: 'error',
      database: 'down',
    });

    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
