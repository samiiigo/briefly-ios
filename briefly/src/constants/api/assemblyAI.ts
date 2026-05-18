import Constants from 'expo-constants';

const ASSEMBLYAI_STREAM_SAMPLE_RATE = 16000;
const ASSEMBLYAI_STREAM_MODEL = 'u3-rt-pro';
const ASSEMBLYAI_ASYNC_MODEL = 'universal-3-pro';

function normalize(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function readExpoExtraKey(): string | undefined {
  const extra = (Constants.expoConfig?.extra as Record<string, unknown> | undefined) ?? {};
  const candidate =
    (extra.assemblyAiApiKey as string | undefined) ??
    (extra.ASSEMBLYAI_API_KEY as string | undefined);
  return normalize(candidate);
}

export function getAssemblyAISharedApiKey(): string | undefined {
  return normalize(process.env.EXPO_PUBLIC_ASSEMBLYAI_API_KEY) ?? readExpoExtraKey();
}

export function requireAssemblyAISharedApiKey(): string {
  const key = getAssemblyAISharedApiKey();
  if (!key) {
    throw new Error(
      'AssemblyAI shared API key is missing in app config. Set EXPO_PUBLIC_ASSEMBLYAI_API_KEY or expo.extra.assemblyAiApiKey.'
    );
  }
  return key;
}

export const AssemblyAIConfig = {
  streamSampleRate: ASSEMBLYAI_STREAM_SAMPLE_RATE,
  streamModel: ASSEMBLYAI_STREAM_MODEL,
  asyncModel: ASSEMBLYAI_ASYNC_MODEL,
} as const;
