import {
  CrossOrganizationError,
  MissingOrganizationContextError,
  OrganizationContext,
} from './organization-context.js';

describe('OrganizationContext', () => {
  const context = new OrganizationContext();

  it('has no scope outside of a run', () => {
    expect(context.current()).toBeUndefined();
  });

  it('keeps the organization across async calls inside a run', async () => {
    const seen = await context.runForOrganization('org-1', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return context.current()?.organizationId;
    });

    expect(seen).toBe('org-1');
  });

  it('keeps concurrent runs isolated from each other', async () => {
    const read = (organizationId: string, delay: number) =>
      context.runForOrganization(organizationId, async () => {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return context.current()?.organizationId;
      });

    await expect(
      Promise.all([read('org-1', 5), read('org-2', 1)]),
    ).resolves.toEqual(['org-1', 'org-2']);
  });

  it('runs a lazy promise inside the scope even if awaited outside', async () => {
    // Like a Prisma query: it only does its work (and reads the context) when
    // someone calls then(), not when it is created.
    const lazyQuery = {
      then(resolve: (value: string | undefined) => void) {
        resolve(context.current()?.organizationId);
      },
    };

    const pending = context.runForOrganization('org-1', () => lazyQuery);

    await expect(pending).resolves.toBe('org-1');
  });

  it('marks system runs so they skip the organization filter', () => {
    context.runAsSystem(() => {
      expect(context.current()).toEqual({ system: true });
    });
  });

  it('lets authentication fill the organization of a request scope', () => {
    context.runForRequest(() => {
      context.setOrganizationId('org-1');
      expect(context.current()?.organizationId).toBe('org-1');
    });
  });

  it('refuses to switch a scope to another organization', () => {
    context.runForOrganization('org-1', () => {
      expect(() => context.setOrganizationId('org-2')).toThrow(
        CrossOrganizationError,
      );
    });
  });

  it('refuses to set an organization without an active scope', () => {
    expect(() => context.setOrganizationId('org-1')).toThrow(
      MissingOrganizationContextError,
    );
  });
});
