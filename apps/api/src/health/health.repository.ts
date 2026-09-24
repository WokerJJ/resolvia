import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Contract used by HealthService. It is an abstract class rather than an
 * interface because interfaces do not exist at runtime, so Nest could not use
 * them as injection tokens.
 */
export abstract class HealthRepository {
  abstract isDatabaseUp(): Promise<boolean>;
}

@Injectable()
export class PrismaHealthRepository implements HealthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async isDatabaseUp(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
