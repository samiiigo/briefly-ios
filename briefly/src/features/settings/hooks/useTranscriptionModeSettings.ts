import { useCallback, useMemo } from 'react';
import { TranscriptionMode } from '@/shared/types';
import {
  normalizeTranscriptionMode,
  transcriptionModeDescription,
  transcriptionModeTitle,
} from '@/features/processing/utils/transcriptionMode';
import { supportsOnDeviceLiveTranscription } from '@/shared/utils/platformCapabilities';
import { useTranscriptionModeSlice } from '@/features/settings/hooks/settingsStoreSlices';
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
