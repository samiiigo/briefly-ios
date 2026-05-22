import type { Recording } from '@/types';
import { resolveRecordingAudioOnDisk } from '@/utils/fileSystem/persistRecordingAudio';

export type RecordingAudioAvailability = {
  /** Single source of truth: audio file is present and playable on this device. */
  hasAudio: boolean;
  /** Resolved on-disk path (may differ from stored metadata). */
  filePath: string;
  fileSize: number;
};

const NO_AUDIO: RecordingAudioAvailability = {
  hasAudio: false,
  filePath: '',
  fileSize: 0,
};

/** Resolves on-disk audio and whether it can be played or shared. */
export function getRecordingAudioAvailability(
  recording: Pick<Recording, 'id' | 'filePath' | 'fileSize'> | undefined,
): RecordingAudioAvailability {
  if (!recording) return NO_AUDIO;

  const resolved = resolveRecordingAudioOnDisk(recording);
  if (!resolved) return NO_AUDIO;

  return {
    hasAudio: true,
    filePath: resolved.filePath,
    fileSize: resolved.fileSize,
  };
}

/** @deprecated Prefer `getRecordingAudioAvailability(recording).hasAudio`. */
export function hasPlayableRecordingAudio(
  recording: Pick<Recording, 'id' | 'filePath' | 'fileSize'>,
): boolean {
  return getRecordingAudioAvailability(recording).hasAudio;
}

/** @deprecated Use `getRecordingAudioAvailability(recording).hasAudio`. */
export function recordingAudioExistsOnDevice(
  recording: Pick<Recording, 'id' | 'filePath' | 'fileSize'>,
): boolean {
  return getRecordingAudioAvailability(recording).hasAudio;
}
