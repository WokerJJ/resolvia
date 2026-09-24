import 'reflect-metadata';
import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  ValidateIf,
  validateSync,
} from 'class-validator';

export enum LlmProviderName {
  Ollama = 'ollama',
  Anthropic = 'anthropic',
}

/**
 * Environment variables required by the API. Defaults mirror `.env.example`;
 * anything without a default must be provided or the app refuses to start.
 */
export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  /** Comma-separated list of origins allowed to call the API from a browser. */
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean)
      : value,
  )
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({ require_tld: false, require_protocol: true }, { each: true })
  CORS_ORIGINS: string[] = ['http://localhost:5173'];

  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRES_IN = '1d';

  @IsEnum(LlmProviderName)
  LLM_PROVIDER = LlmProviderName.Ollama;

  @IsUrl({ require_tld: false, require_protocol: true })
  OLLAMA_BASE_URL = 'http://localhost:11434';

  @IsString()
  @IsNotEmpty()
  OLLAMA_CHAT_MODEL = 'llama3.2:3b';

  @IsString()
  @IsNotEmpty()
  OLLAMA_EMBED_MODEL = 'nomic-embed-text';

  @ValidateIf(
    (env: EnvironmentVariables) =>
      env.LLM_PROVIDER === LlmProviderName.Anthropic,
  )
  @IsString()
  @IsNotEmpty()
  ANTHROPIC_API_KEY?: string;

  @IsString()
  @IsNotEmpty()
  ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const env = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(env);

  if (errors.length > 0) {
    const details = errors
      .flatMap((error) => Object.values(error.constraints ?? {}))
      .join('; ');
    throw new Error(`Invalid environment variables: ${details}`);
  }

  return env;
}
