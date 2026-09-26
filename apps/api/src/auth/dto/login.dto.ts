import { ApiProperty } from '@nestjs/swagger';
import { IsByteLength, IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ana@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: 'una-contraseña-larga' })
  @IsString()
  // No valid password is longer than 72 bytes; rejecting early avoids hashing huge inputs.
  @IsByteLength(1, 72)
  password: string;
}
