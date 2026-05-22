import { File, Paths } from 'expo-file-system';
import { AudioFileService } from '@/services/audio';
import type { Recording } from '@/types';
import { extensionFromFilename } from '@/utils/recording/importKind';
import { recordingAudioDestName } from '@/utils/recording/recordingAudioFilename';
import { deletePath, getPathInfo, normalizeFileUri } from './pathInfo';
import {
  resolveRecordingAudioOnDiskCore,
  type ResolvedRecordingAudio,
} from './recordingAudioResolveCore';
const RECORDING_AUDIO_EXTENSIONS = ['.m4a', '.wav', '.caf', '.mp3', '.mp4', '.aac'] as const;
export type { ResolvedRecordingAudio } from './recordingAudioResolveCore';
export function destFileForRecording(recordingId: string, sourcePath: string): File {
  return new File(Paths.document, recordingAudioDestName(recordingId, sourcePath));
}
function destFileCandidates(recordingId: string, sourcePath: string): File[] {
  if (!recordingId) {
    return [new File(Paths.document, sourcePath)];
  }
  const hinted = extensionFromFilename(sourcePath);
  const extensions = [
    hinted,
    ...RECORDING_AUDIO_EXTENSIONS.filter((ext) => ext !== hinted),
  ].filter(Boolean) as string[];
  return extensions.map(
    (ext) => new File(Paths.document, `rec-${recordingId}${ext}`),
  );
}
const recordingAudioProbe = {
  getPathInfo,
  destFile: (recordingId: string, sourcePath: string) => {
    const candidates = destFileCandidates(recordingId, sourcePath);
    for (const file of candidates) {
      if (file.exists) {
        return { exists: true, uri: file.uri, size: file.size ?? 0 };
      }
    }
    const first = candidates[0];
    return {
      exists: false,
      uri: first?.uri ?? '',
      size: 0,
    };
  },
};
/**
 * Locates the recording audio file on device, including repair fallbacks when
 * stored metadata points at a moved or stale path.
 */
export function resolveRecordingAudioOnDisk(
  recording: Pick<Recording, 'id' | 'filePath' | 'fileSize'>,
): ResolvedRecordingAudio | null {
  return resolveRecordingAudioOnDiskCore(recording, recordingAudioProbe);
}
function isCacheOrTempPath(uri: string): boolean {
  const normalized = normalizeFileUri(uri);
  const cacheUri = normalizeFileUri(Paths.cache.uri);
  return normalized.includes('/Caches/') || normalized.startsWith(cacheUri);
}
/**
 * Copies capture/import audio into the app documents directory so it survives
 * cache clears and app updates. Deletes ephemeral cache copies when safe.
 */
export async function persistRecordingAudio(
  recordingId: string,
  sourceUri: string,
): Promise<{ filePath: string; fileSize: number }> {
  const trimmed = sourceUri.trim();
  if (!trimmed) {
    throw new Error('No audio file was saved for this recording.');
  }
  const dest = destFileForRecording(recordingId, trimmed);
  const destUri = dest.uri;
  const normalizedDest = normalizeFileUri(destUri);
  if (normalizeFileUri(trimmed) === normalizedDest && dest.exists) {
    return { filePath: destUri, fileSize: dest.size ?? 0 };
  }
  const sourceInfo = getPathInfo(trimmed);
  if (!sourceInfo.exists) {
    throw new Error('No audio file was saved for this recording.');
  }
  const persisted = await AudioFileService.copyToDocuments(
    trimmed,
    recordingAudioDestName(recordingId, trimmed),
  );
  const persistedInfo = getPathInfo(persisted);
  const fileSize = persistedInfo.size ?? sourceInfo.size;
  if (normalizeFileUri(trimmed) !== normalizeFileUri(persisted) && isCacheOrTempPath(trimmed)) {
    try {
      deletePath(trimmed);
    } catch {
      // Best-effort cleanup of the recorder temp file.
    }
  }
  return { filePath: persisted, fileSize };
}
/**
 * Re-links stored paths when metadata still points at a moved or renamed file
 * under the documents directory (e.g. after an app update).
 */
export function repairRecordingFilePaths(recordings: Recording[]): {
  recordings: Recording[];
  changed: boolean;
} {
  let changed = false;
  const repaired = recordings.map((recording) => {
    const resolved = resolveRecordingAudioOnDisk(recording);
    if (!resolved) return recording;
    const stored = recording.filePath?.trim();
    if (
      stored === resolved.filePath &&
      recording.fileSize === resolved.fileSize
    ) {
      return recording;
    }
    changed = true;
    return {
      ...recording,
      filePath: resolved.filePath,
      fileSize: resolved.fileSize,
    };
  });
  return { recordings: repaired, changed };
}
