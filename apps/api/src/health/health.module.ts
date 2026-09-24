import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import {
  HealthRepository,
  PrismaHealthRepository,
} from './health.repository.js';
import { HealthService } from './health.service.js';

@Module({
  controllers: [HealthController],
  providers: [
    HealthService,
    { provide: HealthRepository, useClass: PrismaHealthRepository },
  ],
})
export class HealthModule {}
