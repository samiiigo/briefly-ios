import { useCallback, useMemo } from 'react';
import { TranscriptionMode } from '@/types';
import {
  normalizeTranscriptionMode,
  transcriptionModeDescription,
  transcriptionModeTitle,
} from '@/utils/processing/transcriptionMode';
import { supportsOnDeviceLiveTranscription } from '@/utils/platformCapabilities';
import { useTranscriptionModeSlice } from '@/hooks/settings/settingsStoreSlices';
export const TRANSCRIPTION_MODE_OPTIONS: TranscriptionMode[] = ['cloud', 'local'];
export function useTranscriptionModeSettings() {
  const { transcriptionMode, setTranscriptionMode } = useTranscriptionModeSlice();
  const selectedMode = normalizeTranscriptionMode(transcriptionMode);
  const canUseOnDeviceTranscription = supportsOnDeviceLiveTranscription();
  const selectMode = useCallback(
    (mode: TranscriptionMode) => setTranscriptionMode(mode),
    [setTranscriptionMode],
  );
  const options = useMemo(
    () =>
      TRANSCRIPTION_MODE_OPTIONS.map((mode) => ({
        mode,
        selected: selectedMode === mode,
        disabled: mode === 'local' && !canUseOnDeviceTranscription,
        title: transcriptionModeTitle(mode),
        subtitle: transcriptionModeDescription(mode),
      })),
    [canUseOnDeviceTranscription, selectedMode],
  );
  return {
    selectedMode,
    canUseOnDeviceTranscription,
    options,
    selectMode,
    transcriptionModeTitle,
    transcriptionModeDescription,
  };
}
