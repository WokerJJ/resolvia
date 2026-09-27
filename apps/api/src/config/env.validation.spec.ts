import {
  DeploymentMode,
  LlmProviderName,
  validateEnv,
} from './env.validation.js';

const validEnv = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  JWT_SECRET: 'a'.repeat(32),
};

describe('validateEnv', () => {
  it('applies defaults for optional variables', () => {
    const env = validateEnv(validEnv);

    expect(env.PORT).toBe(3000);
    expect(env.JWT_EXPIRES_IN).toBe('1d');
    expect(env.LLM_PROVIDER).toBe(LlmProviderName.OpenAICompatible);
    expect(env.EMBEDDING_MODEL).toBe('bge-m3');
    expect(env.EMBEDDING_DIMENSIONS).toBe(1024);
    expect(env.DEPLOYMENT_MODE).toBe(DeploymentMode.OnPrem);
    expect(env.DEFAULT_ORG_NAME).toBe('Mi organización');
  });

  it('accepts the cloud deployment mode', () => {
    const env = validateEnv({ ...validEnv, DEPLOYMENT_MODE: 'cloud' });

    expect(env.DEPLOYMENT_MODE).toBe(DeploymentMode.Cloud);
  });

  it('fails when DEPLOYMENT_MODE is not supported', () => {
    expect(() =>
      validateEnv({ ...validEnv, DEPLOYMENT_MODE: 'hybrid' }),
    ).toThrow(/DEPLOYMENT_MODE/);
  });

  it('trims DEFAULT_ORG_NAME', () => {
    const env = validateEnv({
      ...validEnv,
      DEFAULT_ORG_NAME: '  Colegio San José  ',
    });

    expect(env.DEFAULT_ORG_NAME).toBe('Colegio San José');
  });

  it.each([
    ['empty', '   '],
    ['without letters or digits', '---'],
    ['longer than 100 characters', 'a'.repeat(101)],
  ])('fails when DEFAULT_ORG_NAME is %s', (_, name) => {
    expect(() => validateEnv({ ...validEnv, DEFAULT_ORG_NAME: name })).toThrow(
      /DEFAULT_ORG_NAME/,
    );
  });

  it('converts numeric strings to numbers', () => {
    const env = validateEnv({ ...validEnv, PORT: '4000' });

    expect(env.PORT).toBe(4000);
  });

  it('parses CORS_ORIGINS as a comma-separated list', () => {
    const env = validateEnv({
      ...validEnv,
      CORS_ORIGINS: 'http://localhost:5173, https://resolvia.example.com',
    });

    expect(env.CORS_ORIGINS).toEqual([
      'http://localhost:5173',
      'https://resolvia.example.com',
    ]);
  });

  it('fails when a CORS origin is not a URL', () => {
    expect(() =>
      validateEnv({ ...validEnv, CORS_ORIGINS: 'not-a-url' }),
    ).toThrow(/CORS_ORIGINS/);
  });

  it('fails when EMBEDDING_DIMENSIONS is not a positive integer', () => {
    expect(() =>
      validateEnv({ ...validEnv, EMBEDDING_DIMENSIONS: '0' }),
    ).toThrow(/EMBEDDING_DIMENSIONS/);
  });

  it('fails when DATABASE_URL is missing', () => {
    expect(() => validateEnv({ JWT_SECRET: validEnv.JWT_SECRET })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('fails when JWT_SECRET is shorter than 32 characters', () => {
    expect(() => validateEnv({ ...validEnv, JWT_SECRET: 'short' })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('fails when LLM_PROVIDER is not supported', () => {
    expect(() => validateEnv({ ...validEnv, LLM_PROVIDER: 'ollama' })).toThrow(
      /LLM_PROVIDER/,
    );
  });

  it('requires LLM_API_KEY only when the provider is anthropic', () => {
    expect(() =>
      validateEnv({
        ...validEnv,
        LLM_PROVIDER: 'openai-compatible',
        LLM_API_KEY: '',
      }),
    ).not.toThrow();
    expect(() =>
      validateEnv({
        ...validEnv,
        LLM_PROVIDER: 'anthropic',
        LLM_API_KEY: '',
      }),
    ).toThrow(/LLM_API_KEY/);
  });
});
