import type { SupabaseClient } from '@supabase/supabase-js';

export class BrieflyFunctionError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'BrieflyFunctionError';
  }
}

export async function invokeBrieflyFunction<TResponse>(
  client: SupabaseClient,
  functionName: string,
  body: Record<string, unknown>,
): Promise<TResponse> {
  const { data, error } = await client.functions.invoke(functionName, { body });
  if (error) {
    throw new BrieflyFunctionError(error.message, error.name);
  }
  if (data && typeof data === 'object' && 'error' in data) {
    const payload = data as { error?: string; code?: string };
    throw new BrieflyFunctionError(payload.error ?? 'Edge function failed.', payload.code);
  }
  return data as TResponse;
}

export async function requireAuthenticatedFunctionSession(client: SupabaseClient): Promise<void> {
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  if (!data.session) {
    throw new BrieflyFunctionError('Sign in is required to use cloud processing.', 'AUTH_REQUIRED');
  }
}
