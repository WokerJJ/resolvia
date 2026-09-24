import { Injectable } from '@nestjs/common';
import { HealthStatusDto } from './dto/health-status.dto.js';
import { HealthRepository } from './health.repository.js';

@Injectable()
export class HealthService {
  constructor(private readonly healthRepository: HealthRepository) {}

  async check(): Promise<HealthStatusDto> {
    const databaseUp = await this.healthRepository.isDatabaseUp();

    return {
      status: databaseUp ? 'ok' : 'error',
      database: databaseUp ? 'up' : 'down',
    };
  }
}
