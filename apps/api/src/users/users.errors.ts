/**
 * Domain error: it says what went wrong, not which HTTP status to return.
 * Mapping it to 409 Conflict is the job of the web layer.
 */
export class EmailAlreadyInUseError extends Error {
  constructor(email: string) {
    super(`Email already in use: ${email}`);
    this.name = 'EmailAlreadyInUseError';
  }
}
