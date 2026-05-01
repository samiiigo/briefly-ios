/**
 * Cloud provider configuration utilities (OCP)
 *
 * All provider-specific metadata lives in a single lookup map.
 * Adding a new provider only requires adding an entry here —
 * no if/else chains elsewhere need modification.
 */

import { CloudProvider } from '../../types';

interface CloudProviderMeta {
  title: string;
  placeholder: string;
  /** Returns true if the key looks like it belongs to this provider. */
  matchesKeyPrefix: (key: string) => boolean;
  /** Returns true if the key format is valid for this provider. */
  isValidFormat: (key: string) => boolean;
}

const PROVIDER_META: Record<CloudProvider, CloudProviderMeta> = {
  openrouter: {
    title: 'OpenRouter',
    placeholder: 'sk-or-...',
    matchesKeyPrefix: (k) => k.startsWith('sk-or-'),
    isValidFormat: (k) => k.startsWith('sk-or-'),
  },
  openai: {
    title: 'OpenAI',
    placeholder: 'sk-proj-...',
    matchesKeyPrefix: (k) => k.startsWith('sk-') || k.startsWith('sk-proj-'),
    isValidFormat: (k) => k.startsWith('sk-') || k.startsWith('sk-proj-'),
  },
  gemini: {
    title: 'Google Gemini',
    placeholder: 'AIza...',
    matchesKeyPrefix: (k) => k.startsWith('AIza') || k.startsWith('AI'),
    isValidFormat: (k) => k.startsWith('AIza') || k.length > 20,
  },
};

export function getProviderTitle(provider: CloudProvider): string {
  return PROVIDER_META[provider]?.title ?? provider;
}

export function getApiKeyPlaceholder(provider: CloudProvider): string {
  return PROVIDER_META[provider]?.placeholder ?? 'Paste your API key';
}

export function isValidApiKeyFormat(key: string, provider: CloudProvider): boolean {
  const trimmed = key.trim();
  return PROVIDER_META[provider]?.isValidFormat(trimmed) ?? trimmed.length > 10;
}

/**
 * Auto-detect the cloud provider from an API key prefix.
 * Checks providers in a defined order to handle overlapping prefixes
 * (e.g., 'sk-or-' must match before 'sk-').
 */
const DETECTION_ORDER: CloudProvider[] = ['openrouter', 'openai', 'gemini'];

export function detectCloudProviderFromKey(key: string): CloudProvider | null {
  const trimmed = key.trim();
  if (!trimmed) return null;
  for (const provider of DETECTION_ORDER) {
    if (PROVIDER_META[provider].matchesKeyPrefix(trimmed)) {
      return provider;
    }
  }
  return null;
}
