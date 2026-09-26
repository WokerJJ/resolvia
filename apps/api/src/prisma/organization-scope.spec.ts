import { Prisma } from '../generated/prisma/client.js';
import { CrossOrganizationError } from '../organizations/organization-context.js';
import { ORGANIZATION_SCOPED_MODELS, scopeArgs } from './organization-scope.js';

describe('ORGANIZATION_SCOPED_MODELS', () => {
  it('lists exactly the models that have an organizationId column', () => {
    const namespace = Prisma as unknown as Record<
      string,
      Record<string, string>
    >;
    const modelsWithOrganization = Object.values(Prisma.ModelName).filter(
      (model) => 'organizationId' in namespace[`${model}ScalarFieldEnum`],
    );

    expect([...ORGANIZATION_SCOPED_MODELS].sort()).toEqual(
      modelsWithOrganization.sort(),
    );
  });
});

describe('scopeArgs', () => {
  const org = 'org-1';

  it('adds the organization to the where of list queries', () => {
    expect(scopeArgs('findMany', { where: { active: true } }, org)).toEqual({
      where: { AND: [{ active: true }, { organizationId: org }] },
    });
  });

  it('adds a where when the query has none', () => {
    expect(scopeArgs('count', undefined, org)).toEqual({
      where: { AND: [{}, { organizationId: org }] },
    });
  });

  it('keeps unique fields at the top level for unique lookups', () => {
    expect(scopeArgs('findUnique', { where: { id: 'x' } }, org)).toEqual({
      where: { id: 'x', organizationId: org },
    });
  });

  it('overrides an organizationId asked for in a lookup', () => {
    expect(
      scopeArgs(
        'findUnique',
        { where: { id: 'x', organizationId: 'org-2' } },
        org,
      ),
    ).toEqual({ where: { id: 'x', organizationId: org } });
  });

  it('sets the organization on created rows', () => {
    expect(scopeArgs('create', { data: { name: 'Redes' } }, org)).toEqual({
      data: { name: 'Redes', organizationId: org },
    });
  });

  it('sets the organization on every row of createMany', () => {
    expect(
      scopeArgs('createMany', { data: [{ name: 'A' }, { name: 'B' }] }, org),
    ).toEqual({
      data: [
        { name: 'A', organizationId: org },
        { name: 'B', organizationId: org },
      ],
    });
  });

  it('rejects creating rows for another organization', () => {
    expect(() =>
      scopeArgs('create', { data: { organizationId: 'org-2' } }, org),
    ).toThrow(CrossOrganizationError);
  });

  it('rejects the organization relation instead of organizationId', () => {
    expect(() =>
      scopeArgs(
        'create',
        { data: { organization: { connect: { id: org } } } },
        org,
      ),
    ).toThrow(CrossOrganizationError);
  });

  it('rejects moving a row to another organization', () => {
    expect(() =>
      scopeArgs(
        'update',
        { where: { id: 'x' }, data: { organizationId: 'org-2' } },
        org,
      ),
    ).toThrow(CrossOrganizationError);
  });

  it('scopes both branches of an upsert', () => {
    expect(
      scopeArgs(
        'upsert',
        { where: { id: 'x' }, create: { name: 'A' }, update: { name: 'B' } },
        org,
      ),
    ).toEqual({
      where: { id: 'x', organizationId: org },
      create: { name: 'A', organizationId: org },
      update: { name: 'B' },
    });
  });
});
