import { Global, Module } from '@nestjs/common';
import { OrganizationContext } from './organization-context.js';

// Global: the Prisma client, guards and services all read the same context.
@Global()
@Module({
  providers: [OrganizationContext],
  exports: [OrganizationContext],
})
export class OrganizationContextModule {}
