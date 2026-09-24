import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthStatusDto } from './dto/health-status.dto.js';
import { HealthService } from './health.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Check that the API and its database are available',
  })
  @ApiOkResponse({ type: HealthStatusDto })
  @ApiServiceUnavailableResponse({
    description: 'The database is not reachable',
  })
  async check(): Promise<HealthStatusDto> {
    const health = await this.healthService.check();

    // 503 lets load balancers and orchestrators take the instance out of rotation.
    if (health.status !== 'ok') {
      throw new ServiceUnavailableException(health);
    }

    return health;
  }
}
