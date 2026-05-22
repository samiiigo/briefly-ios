import { useMemo } from 'react';
import type { Recording } from '@/types';
import {
  getRecordingAudioAvailability,
  type RecordingAudioAvailability,
} from '@/utils/recording/recordingPlayableAudio';

/**
 * Single source of truth for whether a recording's audio file exists on device.
 * Re-resolves when recording id or stored path/size change (including after load/repair).
 */
export function useRecordingAudioAvailability(
  recording: Pick<Recording, 'id' | 'filePath' | 'fileSize'> | undefined,
): RecordingAudioAvailability {
  return useMemo(
    () => getRecordingAudioAvailability(recording),
    [recording?.id, recording?.filePath, recording?.fileSize],
  );
}
