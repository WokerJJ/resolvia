import { randomUUID } from 'node:crypto';
import { Controller, Get, type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import type { AuthenticatedUser, JwtPayload } from '../src/auth/auth.types.js';
import { CurrentUser } from '../src/auth/decorators/current-user.decorator.js';
import { Roles } from '../src/auth/decorators/roles.decorator.js';
import { OrganizationContext } from '../src/organizations/organization-context.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { Role } from '../src/users/user.types.js';
import { createTestApp } from './utils/create-test-app.js';

/** Test-only endpoints to probe the global guards. */
@Controller('guard-probe')
class GuardProbeController {
  constructor(private readonly organizationContext: OrganizationContext) {}

  @Get('scope')
  scope(@CurrentUser() user: AuthenticatedUser) {
    return {
      userOrganization: user.organizationId,
      contextOrganization: this.organizationContext.current()?.organizationId,
    };
  }

  @Get('admin')
  @Roles(Role.Admin)
  admin() {
    return { ok: true };
  }

  @Get('staff')
  @Roles(Role.Technician, Role.Admin)
  staff() {
    return { ok: true };
  }
}

describe('Auth guards (e2e)', () => {
  const prefix = 'auth-guards-e2e-';
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwt: JwtService;
  let organizationId: string;
  let userToken: string;
  let userId: string;

  const get = (path: string, token?: string) => {
    const req = request(app.getHttpServer()).get(path);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };
  const tokenFor = (role: Role, sub = randomUUID()) =>
    jwt.signAsync({ sub, organizationId, role } satisfies JwtPayload);

  beforeAll(async () => {
    app = await createTestApp(undefined, [GuardProbeController]);
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);

    const slug = `${prefix}${randomUUID()}`;
    organizationId = (
      await prisma.organization.create({ data: { name: 'Guards', slug } })
    ).id;

    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        organizationSlug: slug,
        email: `${prefix}${randomUUID()}@example.com`,
        name: 'Ana',
        password: 'una-contraseña-larga',
      })
      .expect(201);
    const body = response.body as { accessToken: string; user: { id: string } };
    userToken = body.accessToken;
    userId = body.user.id;
  });

  // Cleans up by prefix and tolerates a half-run beforeAll, so a setup
  // failure is reported on its own instead of being hidden by this hook.
  afterAll(async () => {
    if (prisma) {
      await app
        .get(OrganizationContext)
        .runAsSystem(() =>
          prisma.user.deleteMany({ where: { email: { startsWith: prefix } } }),
        );
      await prisma.organization.deleteMany({
        where: { slug: { startsWith: prefix } },
      });
    }
    await app?.close();
  });

  describe('GET /api/auth/me', () => {
    it('returns the profile of the signed-in user', async () => {
      const response = await get('/api/auth/me', userToken).expect(200);

      expect(response.body).toMatchObject({
        id: userId,
        organizationId,
        role: 'USER',
      });
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('returns 401 without a token', async () => {
      await get('/api/auth/me').expect(401);
    });

    it('returns 401 with a malformed token', async () => {
      await get('/api/auth/me', 'not-a-jwt').expect(401);
    });

    it('returns 401 with a token signed with another secret', async () => {
      const forged = await new JwtService({ secret: 'b'.repeat(32) }).signAsync(
        { sub: userId, organizationId, role: Role.Admin },
      );

      await get('/api/auth/me', forged).expect(401);
    });

    it('returns 401 with an expired token', async () => {
      const expired = await jwt.signAsync(
        { sub: userId, organizationId, role: Role.User },
        { expiresIn: -10 },
      );

      await get('/api/auth/me', expired).expect(401);
    });

    it('returns 401 when the user of a valid token no longer exists', async () => {
      await get('/api/auth/me', await tokenFor(Role.User)).expect(401);
    });
  });

  it('scopes the request to the organization in the token', async () => {
    const response = await get('/api/guard-probe/scope', userToken).expect(200);

    expect(response.body).toEqual({
      userOrganization: organizationId,
      contextOrganization: organizationId,
    });
  });

  describe('@Roles', () => {
    it('returns 403 when the role is not allowed', async () => {
      await get('/api/guard-probe/admin', userToken).expect(403);
    });

    it('allows the listed role', async () => {
      await get('/api/guard-probe/admin', await tokenFor(Role.Admin)).expect(
        200,
      );
    });

    it('allows any of several listed roles', async () => {
      await get(
        '/api/guard-probe/staff',
        await tokenFor(Role.Technician),
      ).expect(200);
      await get('/api/guard-probe/staff', userToken).expect(403);
    });
  });

  it('keeps public endpoints open without a token', async () => {
    await get('/api/health').expect(200);
  });
});
