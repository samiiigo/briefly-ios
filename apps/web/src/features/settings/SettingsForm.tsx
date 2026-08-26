'use client';

import { themePreferenceTitle } from '@briefly/theme';
import { Button, Stack, Text } from '@briefly/ui';
import {
  processingModeDescription,
  processingModeTitle,
  transcriptionModeDescription,
  transcriptionModeTitle,
  WEB_CLOUD_PROVIDERS,
  WEB_SUMMARIZATION_MODES,
  WEB_TRANSCRIPTION_MODES,
} from '@/features/settings/modeLabels';
import { useSettings } from '@/features/settings/SettingsProvider';

export function SettingsForm() {
  const {
    summarizationMode,
    transcriptionMode,
    themePreference,
    cloudProvider,
    loading,
    saving,
    error,
    setSummarizationMode,
    setTranscriptionMode,
    setThemePreference,
    setCloudProvider,
  } = useSettings();

  if (loading) {
    return (
      <Text as="p" variant="caption">
        Loading settings…
      </Text>
    );
  }

  return (
    <Stack gap="lg">
      <header className="page-header">
        <Text as="h1" variant="title">
          Settings
        </Text>
        <Text as="p" variant="body">
          Preferences sync to your Briefly account and apply across devices.
        </Text>
      </header>

      {error ? (
        <Text as="p" variant="caption" className="auth-error">
          {error}
        </Text>
      ) : null}
      {saving ? (
        <Text as="p" variant="caption">
          Saving…
        </Text>
      ) : null}

      <section className="settings-section">
        <Text as="h2" variant="label">
          Summarization
        </Text>
        <div className="settings-options">
          {WEB_SUMMARIZATION_MODES.map((mode) => (
            <label key={mode} className="settings-option">
              <input
                type="radio"
                name="summarizationMode"
                checked={summarizationMode === mode}
                onChange={() => setSummarizationMode(mode)}
              />
              <span className="settings-option__body">
                <Text as="span" variant="label">
                  {processingModeTitle(mode)}
                </Text>
                <Text as="span" variant="caption">
                  {processingModeDescription(mode)}
                </Text>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <Text as="h2" variant="label">
          Transcription
        </Text>
        <div className="settings-options">
          {WEB_TRANSCRIPTION_MODES.map((mode) => (
            <label key={mode} className="settings-option">
              <input
                type="radio"
                name="transcriptionMode"
                checked={transcriptionMode === mode}
                onChange={() => setTranscriptionMode(mode)}
              />
              <span className="settings-option__body">
                <Text as="span" variant="label">
                  {transcriptionModeTitle(mode)}
                </Text>
                <Text as="span" variant="caption">
                  {transcriptionModeDescription(mode)}
                </Text>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <Text as="h2" variant="label">
          Cloud provider
        </Text>
        <div className="settings-options settings-options--row">
          {WEB_CLOUD_PROVIDERS.map((provider) => (
            <Button
              key={provider}
              variant={cloudProvider === provider ? 'primary' : 'secondary'}
              onClick={() => setCloudProvider(provider)}
            >
              {provider}
            </Button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <Text as="h2" variant="label">
          Appearance
        </Text>
        <div className="settings-options">
          {(['system', 'light', 'dark'] as const).map((preference) => (
            <label key={preference} className="settings-option">
              <input
                type="radio"
                name="themePreference"
                checked={themePreference === preference}
                onChange={() => setThemePreference(preference)}
              />
              <span className="settings-option__body">
                <Text as="span" variant="label">
                  {themePreferenceTitle(preference)}
                </Text>
              </span>
            </label>
          ))}
        </div>
      </section>
    </Stack>
  );
}
