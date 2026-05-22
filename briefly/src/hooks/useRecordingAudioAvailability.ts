import { useLayoutEffect, useMemo } from 'react';
import type { Recording } from '@/types';
import { useRecordingStore } from '@/context/useRecordingStore';
import {
  getRecordingAudioAvailability,
  type RecordingAudioAvailability,
} from '@/utils/recording/recordingPlayableAudio';

const NO_AUDIO: RecordingAudioAvailability = {
  hasAudio: false,
  filePath: '',
  fileSize: 0,
};

/**
 * Single source of truth for whether a recording's audio file exists on device.
 * Recomputed every render from filesystem state; persists repaired paths when found.
 */
export function useRecordingAudioAvailability(
  recording: Pick<Recording, 'id' | 'filePath' | 'fileSize'> | undefined,
): RecordingAudioAvailability {
  const availability = useMemo(
    () => (recording ? getRecordingAudioAvailability(recording) : NO_AUDIO),
    [recording?.id, recording?.filePath, recording?.fileSize],
  );

  useLayoutEffect(() => {
    if (!recording || !availability.hasAudio) return;

    const stored = recording.filePath?.trim() ?? '';
    if (stored === availability.filePath && recording.fileSize === availability.fileSize) {
      return;
    }

    void useRecordingStore.getState().updateRecording(recording.id, {
      filePath: availability.filePath,
      fileSize: availability.fileSize,
    });
  }, [
    recording?.id,
    recording?.filePath,
    recording?.fileSize,
    availability.filePath,
    availability.fileSize,
    availability.hasAudio,
  ]);

  return availability;
}
