/**
 * Centralized environment configuration helpers (scaffold).
 */
export type AppEnvironment = 'development' | 'staging' | 'production';

export function resolveAppEnvironment(value: string | undefined): AppEnvironment {
  if (value === 'production' || value === 'staging') return value;
  return 'development';
}

export function requireEnv(name: string, value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}
