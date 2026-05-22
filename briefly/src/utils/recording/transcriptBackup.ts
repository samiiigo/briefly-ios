import {
  KeyInsight,
  ProcessingMode,
  Recording,
  TranscriptSegment,
  TranscriptionMode,
} from '@/types';
import { generateId, ensureUniqueTitle } from '@/utils/recording/recording';
import { folderFlagsFor } from '@/utils/folders/recordingFolder';
import { hasMeaningfulTranscript } from './recordingValidation';
export const TRANSCRIPT_BACKUP_FORMAT = 'briefly-transcript-backup' as const;
export const TRANSCRIPT_BACKUP_VERSION = 1;
export type TranscriptBackupEntry = {
  title: string;
  createdAt: number;
  duration: number;
  transcript?: TranscriptSegment[];
  summary?: string;
  keyInsights?: KeyInsight[];
  mainEmoji?: string;
  transcriptionMode?: TranscriptionMode;
  processingMode?: ProcessingMode;
};
export type TranscriptBackupFile = {
  format: typeof TRANSCRIPT_BACKUP_FORMAT;
  version: typeof TRANSCRIPT_BACKUP_VERSION;
  exportedAt: number;
  recordings: TranscriptBackupEntry[];
};
export function hasExportableTranscriptContent(recording: Recording): boolean {
  if (recording.deletedAt != null) return false;
  return (
    hasMeaningfulTranscript(recording.transcript) ||
    !!(recording.summary?.trim()) ||
    (recording.keyInsights?.length ?? 0) > 0
  );
}
export function recordingToBackupEntry(recording: Recording): TranscriptBackupEntry {
  return {
    title: recording.title.trim() || 'Untitled recording',
    createdAt: recording.createdAt,
    duration: recording.duration,
    ...(recording.transcript?.length ? { transcript: recording.transcript } : {}),
    ...(recording.summary?.trim() ? { summary: recording.summary.trim() } : {}),
    ...(recording.keyInsights?.length ? { keyInsights: recording.keyInsights } : {}),
    ...(recording.mainEmoji ? { mainEmoji: recording.mainEmoji } : {}),
    ...(recording.transcriptionMode ? { transcriptionMode: recording.transcriptionMode } : {}),
    processingMode: recording.processingMode,
  };
}
export function buildTranscriptBackupFile(recordings: Recording[]): TranscriptBackupFile {
  return {
    format: TRANSCRIPT_BACKUP_FORMAT,
    version: TRANSCRIPT_BACKUP_VERSION,
    exportedAt: Date.now(),
    recordings: recordings.filter(hasExportableTranscriptContent).map(recordingToBackupEntry),
  };
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}
function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function parseTranscriptSegments(raw: unknown): TranscriptSegment[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const segments: TranscriptSegment[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const text = asString(item.text);
    if (!text) continue;
    segments.push({
      id: asString(item.id) || `seg-${segments.length}`,
      text,
      startTime: asNumber(item.startTime),
      endTime: asNumber(item.endTime),
      isFinal: item.isFinal !== false,
      ...(asString(item.speaker) ? { speaker: asString(item.speaker) } : {}),
      ...(asString(item.speakerInitial)
        ? { speakerInitial: asString(item.speakerInitial) }
        : {}),
    });
  }
  return segments.length > 0 ? segments : undefined;
}
function parseKeyInsights(raw: unknown): KeyInsight[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const insights: KeyInsight[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const text = asString(item.text);
    if (!text) continue;
    insights.push({
      id: asString(item.id) || `insight-${insights.length}`,
      text,
    });
  }
  return insights.length > 0 ? insights : undefined;
}
function parseBackupEntry(raw: unknown): TranscriptBackupEntry | null {
  if (!isRecord(raw)) return null;
  const title = asString(raw.title) || 'Imported recording';
  const transcript = parseTranscriptSegments(raw.transcript);
  const summary = asString(raw.summary) || undefined;
  const keyInsights = parseKeyInsights(raw.keyInsights);
  if (!transcript && !summary && !keyInsights) {
    return null;
  }
  return {
    title,
    createdAt: asNumber(raw.createdAt, Date.now()),
    duration: Math.max(0, asNumber(raw.duration)),
    ...(transcript ? { transcript } : {}),
    ...(summary ? { summary } : {}),
    ...(keyInsights ? { keyInsights } : {}),
    ...(asString(raw.mainEmoji) ? { mainEmoji: asString(raw.mainEmoji) } : {}),
    ...(asString(raw.transcriptionMode)
      ? { transcriptionMode: raw.transcriptionMode as TranscriptionMode }
      : {}),
    ...(asString(raw.processingMode)
      ? { processingMode: raw.processingMode as ProcessingMode }
      : {}),
  };
}
function parseBackupEntries(raw: unknown): TranscriptBackupEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: TranscriptBackupEntry[] = [];
  for (const item of raw) {
    const entry = parseBackupEntry(item);
    if (entry) entries.push(entry);
  }
  return entries;
}
export function parseTranscriptBackupJson(jsonText: string): TranscriptBackupEntry[] {
  const trimmed = jsonText.trim();
  if (!trimmed) {
    throw new Error('The file is empty.');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error('Could not read this file. Choose a valid JSON backup.');
  }
  if (Array.isArray(parsed)) {
    const entries = parseBackupEntries(parsed);
    if (entries.length === 0) {
      throw new Error('No transcripts were found in this file.');
    }
    return entries;
  }
  if (!isRecord(parsed)) {
    throw new Error('Unrecognized backup format.');
  }
  if (parsed.format === TRANSCRIPT_BACKUP_FORMAT) {
    const version = asNumber(parsed.version);
    if (version !== TRANSCRIPT_BACKUP_VERSION) {
      throw new Error('This backup was created with a newer version of Briefly.');
    }
  }
  const entries = parseBackupEntries(parsed.recordings);
  if (entries.length === 0) {
    throw new Error('No transcripts were found in this file.');
  }
  return entries;
}
export function serializeTranscriptBackupFile(file: TranscriptBackupFile): string {
  return JSON.stringify(file, null, 2);
}
export function backupEntriesToRecordings(
  entries: TranscriptBackupEntry[],
  existingTitles: string[],
  defaultProcessingMode: ProcessingMode,
): Recording[] {
  const titles = [...existingTitles];
  const imported: Recording[] = [];
  for (const entry of entries) {
    const title = ensureUniqueTitle(entry.title, titles);
    titles.push(title);
    const hasContent =
      hasMeaningfulTranscript(entry.transcript) || !!(entry.summary?.trim());
    imported.push({
      id: generateId(),
      title,
      createdAt: entry.createdAt,
      duration: entry.duration,
      filePath: '',
      fileSize: 0,
      processingMode: entry.processingMode ?? defaultProcessingMode,
      ...(entry.transcriptionMode ? { transcriptionMode: entry.transcriptionMode } : {}),
      ...folderFlagsFor('unlisted'),
      isImported: true,
      status: hasContent ? 'ready' : 'saved',
      ...(entry.transcript ? { transcript: entry.transcript } : {}),
      ...(entry.summary ? { summary: entry.summary } : {}),
      ...(entry.keyInsights ? { keyInsights: entry.keyInsights } : {}),
      ...(entry.mainEmoji ? { mainEmoji: entry.mainEmoji } : {}),
    });
  }
  return imported;
}
