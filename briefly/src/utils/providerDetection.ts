export type DetectedCloudProvider = 'openai' | 'gemini' | 'anthropic' | 'github' | 'openrouter';

interface ProviderMeta {
  label: string;
  endpoint: string;
  matchesKey: (key: string) => boolean;
}

const PROVIDER_REGISTRY: Record<DetectedCloudProvider, ProviderMeta> = {
  openrouter: {
    label: 'OpenRouter',
    endpoint: 'https://openrouter.ai/api/v1',
    matchesKey: (k) => k.startsWith('sk-or-'),
  },
  anthropic: {
    label: 'Anthropic Claude',
    endpoint: 'https://api.anthropic.com/v1',
    matchesKey: (k) => k.startsWith('sk-ant-'),
  },
  openai: {
    label: 'OpenAI',
    endpoint: 'https://api.openai.com/v1',
    matchesKey: (k) => k.startsWith('sk-proj-') || k.startsWith('sk-'),
  },
  gemini: {
    label: 'Google Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    matchesKey: (k) => k.startsWith('AIza'),
  },
  github: {
    label: 'GitHub Models',
    endpoint: 'https://models.inference.ai.azure.com',
    matchesKey: (k) => k.startsWith('github_pat_') || k.startsWith('ghp_'),
  },
};

const DETECTION_ORDER: DetectedCloudProvider[] = [
  'openrouter',
  'anthropic',
  'openai',
  'gemini',
  'github',
];

export function detectProvider(key: string): DetectedCloudProvider | null {
  const k = key.trim();
  if (!k) return null;
  for (const provider of DETECTION_ORDER) {
    if (PROVIDER_REGISTRY[provider].matchesKey(k)) {
      return provider;
    }
  }
  return null;
}

export function providerEndpoint(provider: DetectedCloudProvider): string {
  return PROVIDER_REGISTRY[provider].endpoint;
}

export function providerLabel(provider: DetectedCloudProvider): string {
  return PROVIDER_REGISTRY[provider].label;
}
