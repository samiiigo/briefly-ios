import type { Recording } from '@/types';

export type ResolvedRecordingAudio = {
  filePath: string;
  fileSize: number;
};

export type RecordingAudioPathProbe = {
  getPathInfo: (uri: string) => { exists: boolean; size: number };
  destFile: (
    recordingId: string,
    sourcePath: string,
  ) => { exists: boolean; uri: string; size: number };
};

function resolvedFromProbe(
  filePath: string,
  size: number,
): ResolvedRecordingAudio | null {
  if (size <= 0) return null;
  return { filePath, fileSize: size };
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
        stored,
        storedInfo.size ?? recording.fileSize,
      );
      if (resolved) return resolved;
    }

    const basename = stored.split('/').pop()?.split('?')[0] ?? '';
    if (basename) {
      const byName = probe.destFile('', basename);
      const resolved = resolvedFromProbe(byName.uri, byName.size ?? recording.fileSize);
      if (byName.exists && resolved) return resolved;
    }
  }

  const byId = probe.destFile(recording.id, stored ?? '');
  const byIdResolved = resolvedFromProbe(byId.uri, byId.size ?? recording.fileSize);
  if (byId.exists && byIdResolved) return byIdResolved;

  return null;
}
