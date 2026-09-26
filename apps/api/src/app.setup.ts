import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { EnvironmentVariables } from './config/env.validation.js';
import { OrganizationContext } from './organizations/organization-context.js';

export const API_PREFIX = 'api';

/**
 * HTTP configuration shared by main.ts and the e2e tests, so the tests
 * exercise exactly the same app that runs in production.
 */
export function configureApp(app: INestApplication): void {
  const config =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  // Each request gets its own organization scope; authentication fills it
  // from the JWT, so queries can never mix organizations between requests.
  const organizationContext = app.get(OrganizationContext);
  app.use((_req: unknown, _res: unknown, next: () => void) =>
    organizationContext.runForRequest(next),
  );

  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties that are not declared in the DTO
      forbidNonWhitelisted: true, // ...and reject the request if any were sent
      transform: true, // turn plain bodies into DTO instances
    }),
  );
  app.enableCors({ origin: config.get('CORS_ORIGINS', { infer: true }) });

  setupSwagger(app);
}

function setupSwagger(app: INestApplication): void {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Resolvia API')
      .setDescription(
        'Smart help desk: support tickets classified by AI and answer suggestions based on the knowledge base.',
      )
      .setVersion('0.1.0')
      .addBearerAuth()
      .build(),
  );

  // Served at /api/docs (UI) and /api/docs-json (OpenAPI document).
  SwaggerModule.setup('docs', app, document, { useGlobalPrefix: true });
}
