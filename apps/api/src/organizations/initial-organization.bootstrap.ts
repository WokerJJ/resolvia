import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeploymentMode,
  type EnvironmentVariables,
} from '../config/env.validation.js';
import { OrganizationsService } from './organizations.service.js';

/**
 * On-premise, creates the installation's organization on the first start,
 * named DEFAULT_ORG_NAME (ADR 0005). In the cloud, organizations are created
 * one by one, so it does nothing. If it fails, the app does not start.
 */
@Injectable()
export class InitialOrganizationBootstrap implements OnApplicationBootstrap {
  private readonly logger = new Logger(InitialOrganizationBootstrap.name);

  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (
      this.config.get('DEPLOYMENT_MODE', { infer: true }) !==
      DeploymentMode.OnPrem
    ) {
      return;
    }

    const organization =
      await this.organizationsService.createInitialOrganization(
        this.config.get('DEFAULT_ORG_NAME', { infer: true }),
      );
    if (organization) {
      this.logger.log(
        `Created the initial organization "${organization.name}" (${organization.slug})`,
      );
    }
  }
}
