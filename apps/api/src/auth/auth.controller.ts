import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { OrganizationNotFoundError } from '../organizations/organizations.errors.js';
import { EmailAlreadyInUseError } from '../users/users.errors.js';
import { AuthService } from './auth.service.js';
import {
  type AuthenticatedUser,
  InvalidCredentialsError,
} from './auth.types.js';
import { ApiAuth } from './decorators/api-auth.decorator.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

/**
 * Translates domain errors into HTTP responses. Temporary: the global
 * exception filter of day 16 will take over this job for every module.
 */
function toHttpError(error: unknown): unknown {
  if (error instanceof EmailAlreadyInUseError) {
    return new ConflictException('Email already in use');
  }
  if (error instanceof OrganizationNotFoundError) {
    return new NotFoundException('Organization not found');
  }
  if (error instanceof InvalidCredentialsError) {
    return new UnauthorizedException(error.message);
  }
  return error;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Create a user in an organization and sign in' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  @ApiNotFoundResponse({ description: 'The organization does not exist' })
  @ApiConflictResponse({ description: 'The email is already registered' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    try {
      return await this.authService.register(dto);
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    try {
      return await this.authService.login(dto.email, dto.password);
    } catch (error) {
      throw toHttpError(error);
    }
  }

  @Get('me')
  @ApiAuth()
  @ApiOperation({ summary: 'Profile of the signed-in user' })
  @ApiOkResponse({ type: UserResponseDto })
  async me(
    @CurrentUser() current: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    const user = await this.authService.getCurrentUser(current.id);
    if (!user) {
      // Valid token, but the user no longer exists.
      throw new UnauthorizedException('User no longer exists');
    }
    return user;
  }
}
