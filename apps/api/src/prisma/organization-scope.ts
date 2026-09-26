import { Prisma } from '../generated/prisma/client.js';
import {
  CrossOrganizationError,
  MissingOrganizationContextError,
  type OrganizationContext,
} from '../organizations/organization-context.js';

/**
 * Models that carry organizationId (ADR 0005). A unit test checks that this
 * list matches the schema, so a new model cannot be forgotten.
 *
 * Child models (Comment, TicketEvent, AiSuggestion, DocumentChunk) inherit the
 * organization of their parent: their repositories must reach them through a
 * parent that already passed this filter.
 */
export const ORGANIZATION_SCOPED_MODELS: ReadonlySet<string> = new Set([
  'User',
  'Ticket',
  'Category',
  'KnowledgeDocument',
  'SlaPolicy',
]);

type Args = Record<string, unknown>;

// Operations whose `where` must keep a unique field at the top level.
const UNIQUE_WHERE_OPERATIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'update',
  'upsert',
  'delete',
]);
const CREATE_OPERATIONS = new Set([
  'create',
  'createMany',
  'createManyAndReturn',
]);

function checkData(data: unknown, organizationId: string, isCreate: boolean) {
  if (typeof data !== 'object' || data === null) return data;
  const record = data as Args;

  if ('organization' in record) {
    throw new CrossOrganizationError(
      'Scoped models must use organizationId, not the organization relation',
    );
  }
  if (
    record.organizationId !== undefined &&
    record.organizationId !== organizationId
  ) {
    throw new CrossOrganizationError(
      'Cannot write data that belongs to another organization',
    );
  }
  return isCreate ? { ...record, organizationId } : record;
}

/**
 * Rewrites the arguments of a query on a scoped model so it only reads and
 * writes rows of `organizationId`. Pure function, tested without a database.
 */
export function scopeArgs(
  operation: string,
  args: Args | undefined,
  organizationId: string,
): Args {
  const scoped: Args = { ...args };
  const isCreate = CREATE_OPERATIONS.has(operation);

  if (!isCreate) {
    const where = (scoped.where ?? {}) as Args;
    scoped.where = UNIQUE_WHERE_OPERATIONS.has(operation)
      ? { ...where, organizationId }
      : { AND: [where, { organizationId }] };
  }

  if ('data' in scoped) {
    scoped.data = Array.isArray(scoped.data)
      ? scoped.data.map((item) => checkData(item, organizationId, isCreate))
      : checkData(scoped.data, organizationId, isCreate);
  }

  if (operation === 'upsert') {
    scoped.create = checkData(scoped.create, organizationId, true);
    scoped.update = checkData(scoped.update, organizationId, false);
  }

  return scoped;
}

/**
 * Prisma extension that applies scopeArgs to every query on a scoped model.
 * Deny by default: without an organization in the context the query fails,
 * instead of silently returning rows of every organization.
 */
export function organizationScope(context: OrganizationContext) {
  return Prisma.defineExtension({
    name: 'organization-scope',
    query: {
      $allModels: {
        $allOperations({ model, operation, args, query }) {
          if (!ORGANIZATION_SCOPED_MODELS.has(model)) {
            return query(args);
          }

          const scope = context.current();
          if (scope?.system) {
            return query(args);
          }
          if (!scope?.organizationId) {
            throw new MissingOrganizationContextError(
              `${model}.${operation} needs an organization`,
            );
          }

          return query(
            scopeArgs(
              operation,
              args as Args,
              scope.organizationId,
            ) as typeof args,
          );
        },
      },
    },
  });
}
