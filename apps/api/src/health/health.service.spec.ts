import { HealthRepository } from './health.repository.js';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  const healthRepository = { isDatabaseUp: vi.fn<() => Promise<boolean>>() };
  const service = new HealthService(
    healthRepository as unknown as HealthRepository,
  );

  it('reports ok when the database is up', async () => {
    healthRepository.isDatabaseUp.mockResolvedValue(true);

    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
  });

  it('reports error when the database is down', async () => {
    healthRepository.isDatabaseUp.mockResolvedValue(false);

    await expect(service.check()).resolves.toEqual({
      status: 'error',
      database: 'down',
    });
  });
});
