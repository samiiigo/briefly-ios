export type ManualRerunSource = 'audio' | 'transcript' | 'none';
export function resolveManualRerunSourceFromFlags(
  hasAudioOnDisk: boolean,
  hasTranscript: boolean,
): ManualRerunSource {
  if (hasAudioOnDisk) return 'audio';
  if (hasTranscript) return 'transcript';
  return 'none';
}
