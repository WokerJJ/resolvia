import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateOrganizationData,
  Organization,
} from './organization.types.js';
import { OrganizationSlugInUseError } from './organizations.errors.js';

/**
 * Contract used by OrganizationsService. Abstract class instead of interface
 * so Nest can use it as an injection token.
 */
export abstract class OrganizationsRepository {
  /** @throws OrganizationSlugInUseError if the slug is already taken. */
  abstract create(data: CreateOrganizationData): Promise<Organization>;
  abstract findById(id: string): Promise<Organization | null>;
  abstract findBySlug(slug: string): Promise<Organization | null>;
}

@Injectable()
export class PrismaOrganizationsRepository implements OrganizationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateOrganizationData): Promise<Organization> {
    try {
      return await this.prisma.organization.create({ data });
    } catch (error) {
      // The unique index on slug is the real guarantee against concurrent creations.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new OrganizationSlugInUseError(data.slug);
      }
      throw error;
    }
  }

  findById(id: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({ where: { id } });
  }

  findBySlug(slug: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({ where: { slug } });
  }
}
