import { LlmProviderName, validateEnv } from './env.validation.js';

const validEnv = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  JWT_SECRET: 'a'.repeat(32),
};

describe('validateEnv', () => {
  it('applies defaults for optional variables', () => {
    const env = validateEnv(validEnv);

    expect(env.PORT).toBe(3000);
    expect(env.JWT_EXPIRES_IN).toBe('1d');
    expect(env.LLM_PROVIDER).toBe(LlmProviderName.Ollama);
  });

  it('converts numeric strings to numbers', () => {
    const env = validateEnv({ ...validEnv, PORT: '4000' });

    expect(env.PORT).toBe(4000);
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
    expect(() => validateEnv({ ...validEnv, LLM_PROVIDER: 'openai' })).toThrow(
      /LLM_PROVIDER/,
    );
  });

  it('requires ANTHROPIC_API_KEY only when the provider is anthropic', () => {
    expect(() =>
      validateEnv({ ...validEnv, LLM_PROVIDER: 'ollama', ANTHROPIC_API_KEY: '' }),
    ).not.toThrow();
    expect(() =>
      validateEnv({
        ...validEnv,
        LLM_PROVIDER: 'anthropic',
        ANTHROPIC_API_KEY: '',
      }),
    ).toThrow(/ANTHROPIC_API_KEY/);
  });
});
