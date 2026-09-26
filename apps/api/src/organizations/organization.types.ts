/**
 * Domain types for organizations (ADR 0005). On-premise there is a single
 * organization per installation; in the cloud there are many.
 */
export interface Organization {
  id: string;
  name: string;
  /** URL-friendly unique identifier, e.g. "institucion-educativa-san-jose". */
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrganizationData {
  name: string;
  slug: string;
}
