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

/** Chat providers supported by the ai module (see ADR 0004). */
export enum LlmProviderName {
  OpenAICompatible = 'openai-compatible',
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

  // Chat model. 'openai-compatible' covers OpenAI, Azure OpenAI, Gemini, vLLM, Ollama...
  @IsEnum(LlmProviderName)
  LLM_PROVIDER = LlmProviderName.OpenAICompatible;

  @IsUrl({ require_tld: false, require_protocol: true })
  LLM_BASE_URL = 'http://localhost:11434/v1';

  @ValidateIf(
    (env: EnvironmentVariables) =>
      env.LLM_PROVIDER === LlmProviderName.Anthropic,
  )
  @IsString()
  @IsNotEmpty()
  LLM_API_KEY?: string;

  @IsString()
  @IsNotEmpty()
  LLM_CHAT_MODEL = 'llama3.2:3b';

  // Embedding model, configured independently from the chat model.
  @IsUrl({ require_tld: false, require_protocol: true })
  EMBEDDING_BASE_URL = 'http://localhost:11434/v1';

  @IsString()
  EMBEDDING_API_KEY = '';

  @IsString()
  @IsNotEmpty()
  EMBEDDING_MODEL = 'bge-m3'; // multilingual (ADR 0008)

  /** Must match the vector columns in the schema (vector(1024)). */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  EMBEDDING_DIMENSIONS: number = 1024;
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
