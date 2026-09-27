import {
  Global,
  Module,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../config/env.validation.js';
import { OrganizationContext } from '../organizations/organization-context.js';
import { OrganizationContextModule } from '../organizations/organization-context.module.js';
import { createPrismaService, PrismaService } from './prisma.service.js';

@Global()
@Module({
  imports: [OrganizationContextModule],
  providers: [
    {
      provide: PrismaService,
      useFactory: (
        config: ConfigService<EnvironmentVariables, true>,
        context: OrganizationContext,
      ) =>
        createPrismaService(
          config.get('DATABASE_URL', { infer: true }),
          context,
        ),
      inject: [ConfigService, OrganizationContext],
    },
  ],
  exports: [PrismaService],
})
export class PrismaModule implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    // Fail fast on startup if the database is unreachable.
    await this.prisma.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
