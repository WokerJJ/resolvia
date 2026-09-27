import bcrypt from 'bcrypt';
import type { OrganizationContext } from '../../src/organizations/organization-context.js';
import { slugify } from '../../src/organizations/organizations.service.js';
import type { PrismaService } from '../../src/prisma/prisma.service.js';
import { Role } from '../../src/users/user.types.js';
import { BCRYPT_ROUNDS } from '../../src/users/users.service.js';

/** Password of every seeded user. Development only: it is public in the README. */
export const DEVELOPMENT_PASSWORD = 'resolvia-dev-2026';

/** One user per role, so each part of the app can be tried by hand. */
const USERS = [
  { localPart: 'admin', name: 'Administradora de prueba', role: Role.Admin },
  { localPart: 'tecnico', name: 'Técnico de prueba', role: Role.Technician },
  { localPart: 'usuario', name: 'Usuario de prueba', role: Role.User },
] as const;

/** Usual categories of an IT help desk; each organization can change them later. */
const CATEGORIES = [
  { name: 'Hardware', description: 'Equipos, pantallas y periféricos' },
  { name: 'Software', description: 'Instalación y fallas de programas' },
  { name: 'Redes e internet', description: 'Wi-Fi, cableado y conexión' },
  {
    name: 'Cuentas y accesos',
    description: 'Contraseñas, permisos y bloqueos',
  },
  { name: 'Correo electrónico', description: 'Buzones, envío y recepción' },
  { name: 'Impresoras', description: 'Impresión, escáneres y tóner' },
  { name: 'Otros', description: 'Lo que no encaja en otra categoría' },
] as const;

/** Default SLA per priority, in minutes (first response and resolution). */
const SLA_POLICIES = [
  { priority: 'CRITICAL', responseMinutes: 30, resolutionMinutes: 4 * 60 },
  { priority: 'HIGH', responseMinutes: 60, resolutionMinutes: 8 * 60 },
  { priority: 'MEDIUM', responseMinutes: 4 * 60, resolutionMinutes: 24 * 60 },
  { priority: 'LOW', responseMinutes: 8 * 60, resolutionMinutes: 72 * 60 },
] as const;

export interface DevelopmentSeedOptions {
  organizationName: string;
  /** Domain of the seeded emails: admin@<domain>, tecnico@<domain>... */
  emailDomain: string;
}

export interface DevelopmentSeedResult {
  organization: { id: string; name: string; slug: string };
  users: { email: string; role: Role }[];
}

/**
 * Creates or updates the development data. Idempotent: it upserts by natural
 * keys (slug, email, category name, priority), so running it again resets the
 * seeded rows to these values without duplicating them.
 *
 * @throws Error, without writing anything, if the organization already has
 * users other than the seeded ones: it is a real organization, and the seed
 * would add an ADMIN with a public password to it.
 */
export async function seedDevelopmentData(
  prisma: PrismaService,
  context: OrganizationContext,
  options: DevelopmentSeedOptions,
): Promise<DevelopmentSeedResult> {
  const name = options.organizationName.trim();
  const slug = slugify(name);
  const organization = await prisma.organization.upsert({
    where: { slug },
    create: { name, slug },
    update: {},
    select: { id: true, name: true, slug: true },
  });

  const emailOf = (user: (typeof USERS)[number]) =>
    `${user.localPart}@${options.emailDomain}`.toLowerCase();

  // Everything else belongs to the organization, so it is written inside its
  // scope: organizationScope checks each row (ADR 0005).
  const users = await context.runForOrganization(organization.id, async () => {
    const foreignUser = await prisma.user.findFirst({
      where: { email: { notIn: USERS.map(emailOf) } },
      select: { id: true },
    });
    if (foreignUser) {
      throw new Error(
        `The organization "${organization.name}" already has users that the seed did not create; ` +
          'the development seed only runs on development organizations.',
      );
    }

    const passwordHash = await bcrypt.hash(DEVELOPMENT_PASSWORD, BCRYPT_ROUNDS);
    const seeded: DevelopmentSeedResult['users'] = [];
    for (const user of USERS) {
      const email = emailOf(user);
      await prisma.user.upsert({
        where: { email },
        create: {
          organizationId: organization.id,
          email,
          name: user.name,
          role: user.role,
          passwordHash,
        },
        update: { name: user.name, role: user.role, passwordHash },
      });
      seeded.push({ email, role: user.role });
    }

    for (const category of CATEGORIES) {
      await prisma.category.upsert({
        where: {
          organizationId_name: {
            organizationId: organization.id,
            name: category.name,
          },
        },
        create: { organizationId: organization.id, ...category },
        update: { description: category.description, active: true },
      });
    }

    for (const policy of SLA_POLICIES) {
      await prisma.slaPolicy.upsert({
        where: {
          organizationId_priority: {
            organizationId: organization.id,
            priority: policy.priority,
          },
        },
        create: { organizationId: organization.id, ...policy },
        update: {
          responseMinutes: policy.responseMinutes,
          resolutionMinutes: policy.resolutionMinutes,
        },
      });
    }

    return seeded;
  });

  return { organization, users };
}
