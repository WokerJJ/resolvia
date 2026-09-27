/**
 * Canonical form of an email: emails are unique regardless of case or
 * surrounding spaces, so they are stored and looked up normalized.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
