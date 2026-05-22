import { extensionFromFilename } from './importKind';

export function recordingAudioDestName(recordingId: string, sourcePath: string): string {
  const ext = extensionFromFilename(sourcePath) || '.wav';
  return `rec-${recordingId}${ext}`;
}
