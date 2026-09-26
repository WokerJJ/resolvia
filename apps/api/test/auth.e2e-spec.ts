import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import type { JwtPayload } from '../src/auth/auth.types.js';
import { OrganizationContext } from '../src/organizations/organization-context.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp } from './utils/create-test-app.js';

describe('Auth (e2e)', () => {
  const prefix = 'auth-e2e-';
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let organizationId: string;
  let organizationSlug: string;

  const newEmail = () => `${prefix}${randomUUID()}@example.com`;
  const password = 'una-contraseña-larga';
  const register = (body: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/api/auth/register').send(body);
  const login = (body: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/api/auth/login').send(body);

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);

    organizationSlug = `${prefix}${randomUUID()}`;
    organizationId = (
      await prisma.organization.create({
        data: { name: 'Auth test', slug: organizationSlug },
      })
    ).id;
  });

  afterAll(async () => {
    await app
      .get(OrganizationContext)
      .runAsSystem(() =>
        prisma.user.deleteMany({ where: { email: { startsWith: prefix } } }),
      );
    await prisma.organization.delete({ where: { id: organizationId } });
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('creates a USER in the organization and returns a token', async () => {
      const email = newEmail();

      const response = await register({
        organizationSlug,
        email,
        name: '  Ana Gómez  ',
        password,
      }).expect(201);

      const body = response.body as {
        accessToken: string;
        tokenType: string;
        user: Record<string, unknown>;
      };
      expect(body.tokenType).toBe('Bearer');
      expect(body.user).toMatchObject({
        organizationId,
        email,
        name: 'Ana Gómez',
        role: 'USER',
      });
      expect(body.user).not.toHaveProperty('passwordHash');

      const payload = await app
        .get(JwtService)
        .verifyAsync<JwtPayload>(body.accessToken);
      expect(payload).toMatchObject({ organizationId, role: 'USER' });
    });

    it('returns 409 when the email is already registered', async () => {
      const email = newEmail();
      await register({ organizationSlug, email, name: 'Ana', password });

      await register({ organizationSlug, email, name: 'Ana', password }).expect(
        409,
      );
    });

    it('returns 404 when the organization does not exist', async () => {
      await register({
        organizationSlug: `${prefix}missing`,
        email: newEmail(),
        name: 'Ana',
        password,
      }).expect(404);
    });

    it('rejects passwords shorter than 8 bytes', async () => {
      await register({
        organizationSlug,
        email: newEmail(),
        name: 'Ana',
        password: 'short',
      }).expect(400);
    });

    it('rejects passwords longer than 72 bytes, counting bytes and not characters', async () => {
      // 40 "ñ" are 40 characters but 80 bytes in UTF-8.
      await register({
        organizationSlug,
        email: newEmail(),
        name: 'Ana',
        password: 'ñ'.repeat(40),
      }).expect(400);
    });

    it('rejects properties that are not in the DTO, such as role', async () => {
      await register({
        organizationSlug,
        email: newEmail(),
        name: 'Ana',
        password,
        role: 'ADMIN',
      }).expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    const email = `${prefix}login-${randomUUID()}@example.com`;

    beforeAll(async () => {
      await register({ organizationSlug, email, name: 'Ana', password }).expect(
        201,
      );
    });

    it('returns 200 and a token with the organization of the user', async () => {
      const response = await login({
        email: email.toUpperCase(),
        password,
      }).expect(200);

      const payload = await app
        .get(JwtService)
        .verifyAsync<JwtPayload>(
          (response.body as { accessToken: string }).accessToken,
        );
      expect(payload.organizationId).toBe(organizationId);
    });

    it('returns the same 401 for a wrong password and for an unknown email', async () => {
      const wrongPassword = await login({ email, password: 'wrong-password' });
      const unknownEmail = await login({ email: newEmail(), password });

      expect(wrongPassword.status).toBe(401);
      expect(unknownEmail.status).toBe(401);
      expect(wrongPassword.body).toEqual(unknownEmail.body);
    });
  });
});
