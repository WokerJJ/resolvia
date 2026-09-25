import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // npm scripts run from apps/api; the shared .env lives at the repo root.
      envFilePath: ['.env', '../../.env'],
      validate: validateEnv,
    }),
    PrismaModule,
    HealthModule,
    UsersModule,
  ],
})
export class AppModule {}
