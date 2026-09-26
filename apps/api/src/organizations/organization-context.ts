import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';

/** Which organization the current request or task is acting for (ADR 0005). */
export interface OrganizationScope {
  organizationId?: string;
  /** System operations (login lookup, seeds, cross-organization jobs) skip the filter. */
  system: boolean;
}

export class MissingOrganizationContextError extends Error {
  constructor(detail = 'no organization in the current context') {
    super(`Missing organization context: ${detail}`);
    this.name = 'MissingOrganizationContextError';
  }
}

export class CrossOrganizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CrossOrganizationError';
  }
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

/**
 * Keeps the current organization for the whole async flow of a request or task,
 * without passing it through every function. Built on AsyncLocalStorage: each
 * run() gets its own scope, even with many requests running concurrently.
 */
@Injectable()
export class OrganizationContext {
  private readonly storage = new AsyncLocalStorage<OrganizationScope>();

  /** Runs fn acting for one organization. */
  runForOrganization<T>(organizationId: string, fn: () => T): T {
    return this.runIn({ organizationId, system: false }, fn);
  }

  /** Runs fn without organization filtering. Use only for genuinely global operations. */
  runAsSystem<T>(fn: () => T): T {
    return this.runIn({ system: true }, fn);
  }

  /** Opens an empty scope for an HTTP request; authentication fills it later. */
  runForRequest<T>(fn: () => T): T {
    return this.runIn({ system: false }, fn);
  }

  /** Sets the organization of the current scope (the auth guard calls this). */
  setOrganizationId(organizationId: string): void {
    const scope = this.storage.getStore();
    if (!scope) {
      throw new MissingOrganizationContextError('no active scope to set');
    }
    if (scope.organizationId && scope.organizationId !== organizationId) {
      throw new CrossOrganizationError(
        'The current scope already belongs to another organization',
      );
    }
    scope.organizationId = organizationId;
  }

  current(): Readonly<OrganizationScope> | undefined {
    return this.storage.getStore();
  }

  private runIn<T>(scope: OrganizationScope, fn: () => T): T {
    return this.storage.run(scope, () => {
      const result = fn();
      // Prisma queries are lazy: they run when awaited, not when called. If fn
      // returns a query without awaiting it, awaiting it here keeps it inside
      // this scope instead of wherever the caller awaits it.
      return isPromiseLike(result)
        ? ((async () => await result)() as T)
        : result;
    });
  }
}
