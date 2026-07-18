import type { CloudProvider, ProcessingMode, TranscriptionMode } from '@briefly/types';
import { validateObject } from '@briefly/validation';

/** Synced settings subset stored in account_settings (no API keys). */
export interface AccountSettingsPayload extends Record<string, unknown> {
  summarizationMode?: ProcessingMode;
  transcriptionMode?: TranscriptionMode;
  showLivePreview?: boolean;
  cloudProvider?: CloudProvider;
  hasCompletedEnvSetup?: boolean;
  themePreference?: 'system' | 'light' | 'dark';
}

const settingsSchema = {
  type: 'object' as const,
  strict: true,
  fields: {
    summarizationMode: {
      type: 'enum' as const,
      values: ['on-device', 'cloud', 'cloud-shared-openrouter', 'cloud-user-key'] as const,
    },
    transcriptionMode: {
      type: 'enum' as const,
      values: ['cloud', 'local'] as const,
    },
    showLivePreview: { type: 'boolean' as const },
    cloudProvider: {
      type: 'enum' as const,
      values: ['openrouter', 'openai', 'gemini'] as const,
    },
    hasCompletedEnvSetup: { type: 'boolean' as const },
    themePreference: {
      type: 'enum' as const,
      values: ['system', 'light', 'dark'] as const,
    },
  },
};

/** Default settings for a new account sync row. */
export function defaultSettings(): AccountSettingsPayload {
  return {
    summarizationMode: 'cloud-shared-openrouter',
    transcriptionMode: 'cloud',
    showLivePreview: true,
    cloudProvider: 'openrouter',
    hasCompletedEnvSetup: false,
    themePreference: 'system',
  };
}

/** Validate and normalize a settings payload from client or database. */
export function normalizeSettingsPayload(input: unknown): AccountSettingsPayload {
  return validateObject<AccountSettingsPayload>(input, settingsSchema);
}
