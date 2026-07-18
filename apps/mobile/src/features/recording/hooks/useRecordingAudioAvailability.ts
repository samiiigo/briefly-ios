import { useLayoutEffect, useMemo } from 'react';
import type { Recording } from '@briefly/types';
import { useRecordingStore } from '@/features/recording/state/useRecordingStore';
import {
  getRecordingAudioAvailability,
  type RecordingAudioAvailability,
} from '@/features/recording/utils/recordingPlayableAudio';
const NO_AUDIO: RecordingAudioAvailability = {
  hasAudio: false,
  filePath: '',
  fileSize: 0,
};
/** Whether the recording's audio file exists on device. */
export function useRecordingAudioAvailability(
  recording: Pick<Recording, 'id' | 'filePath' | 'fileSize'> | undefined,
): RecordingAudioAvailability {
  const availability = useMemo(
    () => (recording ? getRecordingAudioAvailability(recording) : NO_AUDIO),
    [recording],
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
  }, [recording, availability.filePath, availability.fileSize, availability.hasAudio]);
  return availability;
}
