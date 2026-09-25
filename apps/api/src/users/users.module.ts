import { Module } from '@nestjs/common';
import {
  PrismaUsersRepository,
  UsersRepository,
} from './users.repository.js';
import { UsersService } from './users.service.js';

@Module({
  providers: [
    UsersService,
    { provide: UsersRepository, useClass: PrismaUsersRepository },
  ],
  // Only the service is exported: other modules (auth) never touch the repository.
  exports: [UsersService],
})
export class UsersModule {}
