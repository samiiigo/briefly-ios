import {
  BrieflyFunctionError,
  invokeBrieflyFunction as invoke,
  requireAuthenticatedFunctionSession as requireSession,
} from '@briefly/api';
import { getSupabaseClient } from '@/api/supabaseClient';

export { BrieflyFunctionError };

export async function invokeBrieflyFunction<TResponse>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<TResponse> {
  return invoke(getSupabaseClient(), functionName, body);
}

export async function requireAuthenticatedFunctionSession(): Promise<void> {
  return requireSession(getSupabaseClient());
}
