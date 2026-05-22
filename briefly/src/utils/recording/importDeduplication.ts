import { KeyInsight, Recording, TranscriptSegment } from '@/types';
import { transcriptTextContent } from './recordingValidation';
import type { TranscriptBackupEntry } from './transcriptBackup';
const AUDIO_DURATION_TOLERANCE_SEC = 2;
function normalizeSummary(summary?: string): string {
  return (summary ?? '').trim().replace(/\s+/g, ' ');
}
function keyInsightsFingerprint(insights?: KeyInsight[]): string {
  return (insights ?? [])
    .map((i) => i.text.trim())
    .filter(Boolean)
    .sort()
    .join('\n');
}
/** Stable fingerprint for transcript backup rows and existing recordings. */
export function importContentFingerprint(parts: {
  title?: string;
  createdAt?: number;
  transcript?: TranscriptSegment[];
  summary?: string;
  keyInsights?: KeyInsight[];
}): string {
  const transcript = transcriptTextContent(parts.transcript);
  const summary = normalizeSummary(parts.summary);
  const insights = keyInsightsFingerprint(parts.keyInsights);
  if (transcript || summary || insights) {
    return `content:${transcript}|${summary}|${insights}`;
  }
  const title = (parts.title ?? '').trim().toLowerCase();
  return `meta:${title}|${parts.createdAt ?? 0}`;
}
export function backupEntryFingerprint(entry: TranscriptBackupEntry): string {
  return importContentFingerprint(entry);
}
export function recordingImportFingerprint(recording: Recording): string {
  return importContentFingerprint({
    title: recording.title,
    createdAt: recording.createdAt,
    transcript: recording.transcript,
    summary: recording.summary,
    keyInsights: recording.keyInsights,
  });
}
export function filterNewBackupEntries(
  entries: TranscriptBackupEntry[],
  existingRecordings: Recording[],
): { entries: TranscriptBackupEntry[]; skipped: number } {
  const seen = new Set<string>();
  for (const recording of existingRecordings) {
    seen.add(recordingImportFingerprint(recording));
  }
  const fresh: TranscriptBackupEntry[] = [];
  let skipped = 0;
  for (const entry of entries) {
    const fingerprint = backupEntryFingerprint(entry);
    if (seen.has(fingerprint)) {
      skipped += 1;
      continue;
    }
    seen.add(fingerprint);
    fresh.push(entry);
  }
  return { entries: fresh, skipped };
}
export function findDuplicateAudioRecording(
  recordings: Recording[],
  candidate: { fileSize: number; durationSec: number },
): Recording | undefined {
  if (candidate.fileSize <= 0) return undefined;
  const targetDuration = Math.round(candidate.durationSec);
  return recordings.find((recording) => {
    if (!recording.filePath?.trim() || recording.fileSize <= 0) {
      return false;
    }
    if (recording.fileSize !== candidate.fileSize) {
      return false;
    }
    const existingDuration = Math.round(recording.duration);
    return Math.abs(existingDuration - targetDuration) <= AUDIO_DURATION_TOLERANCE_SEC;
  });
}
