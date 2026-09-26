import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OrganizationContext } from '../organizations/organization-context.js';
import { OrganizationNotFoundError } from '../organizations/organizations.errors.js';
import { OrganizationsService } from '../organizations/organizations.service.js';
import type { User } from '../users/user.types.js';
import { UsersService } from '../users/users.service.js';
import {
  type AuthResult,
  InvalidCredentialsError,
  type JwtPayload,
  type RegisterInput,
} from './auth.types.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly organizationsService: OrganizationsService,
    private readonly organizationContext: OrganizationContext,
    private readonly jwtService: JwtService,
  ) {}

  /** Creates a USER in an existing organization and signs them in. */
  async register(input: RegisterInput): Promise<AuthResult> {
    const organization = await this.organizationsService.findBySlug(
      input.organizationSlug,
    );
    if (!organization) {
      throw new OrganizationNotFoundError(input.organizationSlug);
    }

    // Users are scoped by organization: the user is created inside it.
    const user = await this.organizationContext.runForOrganization(
      organization.id,
      () =>
        this.usersService.create({
          organizationId: organization.id,
          email: input.email,
          name: input.name,
          password: input.password,
        }),
    );

    return this.issueToken(user);
  }

  async login(email: string, password: string): Promise<AuthResult> {
    // The organization is unknown until the user is found, so the email lookup
    // is global: this is one of the few genuinely system-wide operations.
    const user = await this.organizationContext.runAsSystem(() =>
      this.usersService.verifyCredentials(email, password),
    );
    if (!user) {
      throw new InvalidCredentialsError();
    }

    return this.issueToken(user);
  }

  private async issueToken(user: User): Promise<AuthResult> {
    const payload: JwtPayload = {
      sub: user.id,
      organizationId: user.organizationId,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      tokenType: 'Bearer',
      user,
    };
  }
}
