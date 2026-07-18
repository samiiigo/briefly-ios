/**
 * Shared vendor API keys are no longer shipped in the mobile client.
 * Cloud features route through authenticated Supabase Edge Functions.
 */
export function getAssemblyAISharedApiKey(): string | undefined {
  return undefined;
}

export function requireAssemblyAISharedApiKey(): string {
  throw new Error(
    'AssemblyAI shared API keys are no longer available in the client. Sign in and use cloud transcription.',
  );
}

export function getOpenRouterSharedApiKey(): string | undefined {
  return undefined;
}

export function requireOpenRouterSharedApiKey(): string {
  throw new Error(
    'OpenRouter shared API keys are no longer available in the client. Sign in and use cloud summarization.',
  );
}
