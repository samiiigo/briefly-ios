import { File, Paths } from 'expo-file-system';
import { AudioFileService } from '@/services/audio';
import type { Recording } from '@/types';
import { recordingAudioDestName } from '@/utils/recording/recordingAudioFilename';
import { deletePath, getPathInfo, normalizeFileUri } from './pathInfo';

function destFileForRecording(recordingId: string, sourcePath: string): File {
  return new File(Paths.document, recordingAudioDestName(recordingId, sourcePath));
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
    const stored = recording.filePath?.trim();
    if (!stored) return recording;

    const storedInfo = getPathInfo(stored);
    if (storedInfo.exists) {
      const size = storedInfo.size ?? recording.fileSize;
      if (size > 0 && size !== recording.fileSize) {
        changed = true;
        return { ...recording, fileSize: size };
      }
      return recording;
    }

    const basename = stored.split('/').pop()?.split('?')[0] ?? '';
    if (basename) {
      const byName = new File(Paths.document, basename);
      if (byName.exists) {
        changed = true;
        return {
          ...recording,
          filePath: byName.uri,
          fileSize: byName.size ?? recording.fileSize,
        };
      }
    }

    const byId = destFileForRecording(recording.id, stored);
    if (byId.exists) {
      changed = true;
      return {
        ...recording,
        filePath: byId.uri,
        fileSize: byId.size ?? recording.fileSize,
      };
    }

    return recording;
  });

  return { recordings: repaired, changed };
}
