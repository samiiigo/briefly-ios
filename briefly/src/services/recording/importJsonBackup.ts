import {
  backupEntriesToRecordings,
  parseTranscriptBackupJson,
} from '@/utils/recording/transcriptBackup';
import { filterNewBackupEntries } from '@/utils/recording/importDeduplication';
import { logger } from '@/utils/logging/logger';
import type { ImportRecordingPorts } from './importRecordingPorts';
export async function importJsonBackupFromText(
  jsonText: string,
  ports: ImportRecordingPorts,
): Promise<{ count: number; skipped: number }> {
  const parsed = parseTranscriptBackupJson(jsonText);
  const recordings = ports.store.getRecordings();
  const { entries, skipped } = filterNewBackupEntries(parsed, recordings);
  if (entries.length === 0) {
    throw new Error(
      skipped > 0
        ? 'Everything in this backup is already in your library.'
        : 'No transcripts were found in this file.',
    );
  }
  const skippedNote =
    skipped > 0
      ? ` ${skipped} duplicate${skipped === 1 ? '' : 's'} will be skipped.`
      : '';
  const confirmed = await ports.confirmation.confirmImport(
    `Import ${entries.length} transcript${entries.length === 1 ? '' : 's'} from this backup?${skippedNote}`,
  );
  if (!confirmed) return { count: 0, skipped };
  const summarizationMode = ports.settings.getSummarizationMode();
  const incoming = backupEntriesToRecordings(
    entries,
    recordings.map((r) => r.title),
    summarizationMode,
  );
  await ports.store.importRecordings(incoming);
  logger.info('Import', 'Imported JSON transcript backup', {
    count: incoming.length,
    skipped,
  });
  return { count: incoming.length, skipped };
}
