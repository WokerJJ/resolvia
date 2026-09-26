import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../users/user.types.js';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  organizationId: string;

  @ApiProperty({ example: 'ana@example.com' })
  email: string;

  @ApiProperty({ example: 'Ana Gómez' })
  name: string;

  @ApiProperty({ enum: Object.values(Role), example: Role.User })
  role: Role;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT with sub, organizationId and role' })
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: 'Bearer';

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
