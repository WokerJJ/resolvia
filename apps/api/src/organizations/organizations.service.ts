import { Injectable } from '@nestjs/common';
import type { Organization } from './organization.types.js';
import {
  InvalidOrganizationNameError,
  OrganizationSlugInUseError,
} from './organizations.errors.js';
import { OrganizationsRepository } from './organizations.repository.js';

export interface CreateOrganizationInput {
  name: string;
  /** Optional: if missing, it is generated from the name. */
  slug?: string;
}

/**
 * Turns a name into a URL-friendly slug:
 * "Institución Educativa San José" -> "institucion-educativa-san-jose".
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD') // split letters from their accents ("é" -> "e" + "´")
    .replace(/[̀-ͯ]/g, '') // drop the accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // any run of other characters becomes one "-"
    .replace(/^-+|-+$/g, ''); // no "-" at the edges
}

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
  ) {}

  async create(input: CreateOrganizationInput): Promise<Organization> {
    const name = input.name.trim();
    // A slug given by hand is normalized too, so every slug follows the same rules.
    const slug = slugify(input.slug ?? name);

    if (!slug) {
      throw new InvalidOrganizationNameError(input.slug ?? input.name);
    }

    const existing = await this.organizationsRepository.findBySlug(slug);
    if (existing) {
      throw new OrganizationSlugInUseError(slug);
    }

    return this.organizationsRepository.create({ name, slug });
  }

  findById(id: string): Promise<Organization | null> {
    return this.organizationsRepository.findById(id);
  }

  findBySlug(slug: string): Promise<Organization | null> {
    return this.organizationsRepository.findBySlug(slugify(slug));
  }
}
