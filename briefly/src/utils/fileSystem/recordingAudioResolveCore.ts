import type { Recording } from '@/types';
export type ResolvedRecordingAudio = {
  filePath: string;
  fileSize: number;
};
export type RecordingAudioPathProbe = {
  getPathInfo: (uri: string) => {
    exists: boolean;
    size: number;
    resolvedUri: string;
  };
  destFile: (
    recordingId: string,
    sourcePath: string,
  ) => { exists: boolean; uri: string; size: number };
};
function effectiveFileSize(reportedSize: number, fallbackSize: number): number {
  if (reportedSize > 0) return reportedSize;
  if (fallbackSize > 0) return fallbackSize;
  // File.size can be 0/undefined while the file is still playable.
  return 1;
}
function resolvedFromProbe(
  filePath: string,
  exists: boolean,
  reportedSize: number,
  fallbackSize: number,
): ResolvedRecordingAudio | null {
  if (!exists) return null;
  return {
    filePath,
    fileSize: effectiveFileSize(reportedSize, fallbackSize),
  };
}
/**
 * Locates recording audio on device using injectable filesystem probes (testable without Expo).
 */
export function resolveRecordingAudioOnDiskCore(
  recording: Pick<Recording, 'id' | 'filePath' | 'fileSize'>,
  probe: RecordingAudioPathProbe,
): ResolvedRecordingAudio | null {
  const stored = recording.filePath?.trim();
  if (stored) {
    const storedInfo = probe.getPathInfo(stored);
    if (storedInfo.exists) {
      const resolved = resolvedFromProbe(
        storedInfo.resolvedUri || stored,
        true,
        storedInfo.size,
        recording.fileSize,
      );
      if (resolved) return resolved;
    }
    const basename = stored.split('/').pop()?.split('?')[0] ?? '';
    if (basename) {
      const byName = probe.destFile('', basename);
      const resolved = resolvedFromProbe(
        byName.uri,
        byName.exists,
        byName.size,
        recording.fileSize,
      );
      if (resolved) return resolved;
    }
  }
  const byId = probe.destFile(recording.id, stored ?? '');
  const byIdResolved = resolvedFromProbe(
    byId.uri,
    byId.exists,
    byId.size,
    recording.fileSize,
  );
  if (byIdResolved) return byIdResolved;
  return null;
}
