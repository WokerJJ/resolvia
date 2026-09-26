import { Module } from '@nestjs/common';
import {
  OrganizationsRepository,
  PrismaOrganizationsRepository,
} from './organizations.repository.js';
import { OrganizationsService } from './organizations.service.js';

@Module({
  providers: [
    OrganizationsService,
    {
      provide: OrganizationsRepository,
      useClass: PrismaOrganizationsRepository,
    },
  ],
  // Only the service is exported: other modules never touch the repository.
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
