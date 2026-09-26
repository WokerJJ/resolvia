import {
  Global,
  Module,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrganizationContext } from '../organizations/organization-context.js';
import { OrganizationContextModule } from '../organizations/organization-context.module.js';
import { createPrismaService, PrismaService } from './prisma.service.js';

@Global()
@Module({
  imports: [OrganizationContextModule],
  providers: [
    {
      provide: PrismaService,
      useFactory: createPrismaService,
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
