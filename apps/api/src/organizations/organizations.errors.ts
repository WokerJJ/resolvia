/** Domain error: mapping it to 409 Conflict is the job of the web layer. */
export class OrganizationSlugInUseError extends Error {
  constructor(slug: string) {
    super(`Organization slug already in use: ${slug}`);
    this.name = 'OrganizationSlugInUseError';
  }
}

/** Domain error: the name produces an empty slug (for example, only symbols). */
export class InvalidOrganizationNameError extends Error {
  constructor(name: string) {
    super(`Organization name cannot be turned into a slug: "${name}"`);
    this.name = 'InvalidOrganizationNameError';
  }
}
