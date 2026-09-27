import type { ConfigService } from '@nestjs/config';
import {
  DeploymentMode,
  type EnvironmentVariables,
} from '../config/env.validation.js';
import { InitialOrganizationBootstrap } from './initial-organization.bootstrap.js';
import type { OrganizationsService } from './organizations.service.js';

describe('InitialOrganizationBootstrap', () => {
  const organizationsService = {
    createInitialOrganization:
      vi.fn<OrganizationsService['createInitialOrganization']>(),
  };

  const bootstrapWith = (mode: DeploymentMode) => {
    const env: Partial<EnvironmentVariables> = {
      DEPLOYMENT_MODE: mode,
      DEFAULT_ORG_NAME: 'Colegio San José',
    };
    const config = {
      get: (key: keyof EnvironmentVariables) => env[key],
    } as unknown as ConfigService<EnvironmentVariables, true>;
    return new InitialOrganizationBootstrap(
      config,
      organizationsService as unknown as OrganizationsService,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    organizationsService.createInitialOrganization.mockResolvedValue(null);
  });

  it('creates the initial organization on-premise', async () => {
    await bootstrapWith(DeploymentMode.OnPrem).onApplicationBootstrap();

    expect(organizationsService.createInitialOrganization).toHaveBeenCalledWith(
      'Colegio San José',
    );
  });

  it('does nothing in the cloud', async () => {
    await bootstrapWith(DeploymentMode.Cloud).onApplicationBootstrap();

    expect(
      organizationsService.createInitialOrganization,
    ).not.toHaveBeenCalled();
  });

  it('fails the start when the organization cannot be created', async () => {
    organizationsService.createInitialOrganization.mockRejectedValue(
      new Error('database is down'),
    );

    await expect(
      bootstrapWith(DeploymentMode.OnPrem).onApplicationBootstrap(),
    ).rejects.toThrow('database is down');
  });
});
