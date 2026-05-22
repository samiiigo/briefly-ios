import type { Recording } from '@/types';
import type { ResolvedRecordingAudio } from '@/utils/fileSystem/persistRecordingAudio';
function resolveRecordingAudioOnDisk(
  recording: Pick<Recording, 'id' | 'filePath' | 'fileSize'>,
): ResolvedRecordingAudio | null {
  const { resolveRecordingAudioOnDisk: resolve } =
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy load; avoids Expo FS in Node tests
    require('@/utils/fileSystem/persistRecordingAudio') as typeof import('@/utils/fileSystem/persistRecordingAudio');
  return resolve(recording);
}
let availabilityOverrideForTests:
  | ((recording: Pick<Recording, 'id' | 'filePath' | 'fileSize'>) => RecordingAudioAvailability)
  | null = null;
/** @internal Overrides on-disk resolution in node unit tests (no Expo). */
export function __setRecordingAudioAvailabilityForTests(
  overrideFn: typeof availabilityOverrideForTests,
): void {
  availabilityOverrideForTests = overrideFn;
}
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
  if (availabilityOverrideForTests) {
    return availabilityOverrideForTests(recording);
  }
  const resolved = resolveRecordingAudioOnDisk(recording);
  if (!resolved) return NO_AUDIO;
  return {
    hasAudio: true,
    filePath: resolved.filePath,
    fileSize: resolved.fileSize,
  };
}
/** Recording metadata with resolved on-disk audio paths when available. */
export function applyResolvedAudioToRecording(recording: Recording): Recording {
  const audio = getRecordingAudioAvailability(recording);
  if (!audio.hasAudio) return recording;
  return { ...recording, filePath: audio.filePath, fileSize: audio.fileSize };
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
