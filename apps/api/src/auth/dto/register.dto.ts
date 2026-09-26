import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsByteLength,
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class RegisterDto {
  @ApiProperty({ example: 'institucion-educativa-san-jose' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  organizationSlug: string;

  @ApiProperty({ example: 'ana@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: 'Ana Gómez' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'una-contraseña-larga',
    description:
      'Between 8 and 72 bytes: bcrypt ignores everything after byte 72, and non-ASCII characters take more than one byte.',
  })
  @IsString()
  @IsByteLength(8, 72, {
    message: 'password must be between 8 and 72 bytes long',
  })
  password: string;
}
