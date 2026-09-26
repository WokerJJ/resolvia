import type { Organization } from './organization.types.js';
import {
  InvalidOrganizationNameError,
  OrganizationSlugInUseError,
} from './organizations.errors.js';
import { OrganizationsRepository } from './organizations.repository.js';
import { OrganizationsService, slugify } from './organizations.service.js';

describe('slugify', () => {
  it('lowercases the text and joins words with "-"', () => {
    expect(slugify('Colegio Central')).toBe('colegio-central');
  });

  it('removes accents', () => {
    expect(slugify('Institución Educativa San José')).toBe(
      'institucion-educativa-san-jose',
    );
  });

  it('collapses spaces and symbols into a single "-"', () => {
    expect(slugify('Colegio  Nº 5 -- Sede Norte')).toBe(
      'colegio-n-5-sede-norte',
    );
  });

  it('removes "-" at the start and at the end', () => {
    expect(slugify('  --Sede Sur!!  ')).toBe('sede-sur');
  });

  it('returns an empty string when there are no letters or digits', () => {
    expect(slugify(' ¡¿#?! ')).toBe('');
  });
});

describe('OrganizationsService', () => {
  const organization: Organization = {
    id: 'org-1',
    name: 'Institución Educativa San José',
    slug: 'institucion-educativa-san-jose',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const organizationsRepository = {
    create: vi.fn<OrganizationsRepository['create']>(),
    findById: vi.fn<OrganizationsRepository['findById']>(),
    findBySlug: vi.fn<OrganizationsRepository['findBySlug']>(),
  };
  const service = new OrganizationsService(
    organizationsRepository as OrganizationsRepository,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    organizationsRepository.findBySlug.mockResolvedValue(null);
    organizationsRepository.create.mockResolvedValue(organization);
    organizationsRepository.findById.mockResolvedValue(organization);
  });

  describe('create', () => {
    it('generates the slug from the name when none is given', async () => {
      await service.create({ name: 'Institución Educativa San José' });

      expect(organizationsRepository.create).toHaveBeenCalledWith({
        name: 'Institución Educativa San José',
        slug: 'institucion-educativa-san-jose',
      });
    });

    it('normalizes a slug given by hand', async () => {
      await service.create({ name: 'Colegio', slug: 'Mi Colegio!' });

      expect(organizationsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'mi-colegio' }),
      );
    });

    it('trims the name before saving', async () => {
      await service.create({ name: '  Colegio Central  ' });

      expect(organizationsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Colegio Central' }),
      );
    });

    it('throws InvalidOrganizationNameError when the slug would be empty', async () => {
      await expect(service.create({ name: '¡¿?!' })).rejects.toBeInstanceOf(
        InvalidOrganizationNameError,
      );
      expect(organizationsRepository.create).not.toHaveBeenCalled();
    });

    it('throws OrganizationSlugInUseError when the slug already exists', async () => {
      organizationsRepository.findBySlug.mockResolvedValue(organization);

      await expect(
        service.create({ name: organization.name }),
      ).rejects.toBeInstanceOf(OrganizationSlugInUseError);
    });

    it('does not call repository.create when the slug already exists', async () => {
      organizationsRepository.findBySlug.mockResolvedValue(organization);

      await expect(
        service.create({ name: organization.name }),
      ).rejects.toThrow();
      expect(organizationsRepository.create).not.toHaveBeenCalled();
    });

    it('returns the organization created by the repository', async () => {
      await expect(service.create({ name: organization.name })).resolves.toBe(
        organization,
      );
    });
  });

  describe('findBySlug', () => {
    it('normalizes the slug before searching', async () => {
      await service.findBySlug('  Institución-Educativa-San-José ');

      expect(organizationsRepository.findBySlug).toHaveBeenCalledWith(
        'institucion-educativa-san-jose',
      );
    });

    it('returns null when the organization does not exist', async () => {
      organizationsRepository.findBySlug.mockResolvedValue(null);

      await expect(service.findBySlug('missing')).resolves.toBeNull();
    });
  });

  describe('findById', () => {
    it('returns the organization found by the repository', async () => {
      await expect(service.findById(organization.id)).resolves.toBe(
        organization,
      );
      expect(organizationsRepository.findById).toHaveBeenCalledWith(
        organization.id,
      );
    });
  });
});
