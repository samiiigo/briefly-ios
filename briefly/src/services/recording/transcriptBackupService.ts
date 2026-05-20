import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { Recording } from '@/types';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useSettingsStore } from '@/context/useSettingsStore';
import { generateId, ensureUniqueTitle } from '@/utils';
import { folderFlagsFor } from '@/utils/folders/recordingFolder';
import { hasMeaningfulTranscript } from '@/utils/recording/recordingValidation';
import {
  buildTranscriptBackupFile,
  parseTranscriptBackupJson,
  serializeTranscriptBackupFile,
  TranscriptBackupEntry,
} from '@/utils/recording/transcriptBackup';
import { logger } from '@/utils/logging/logger';

function backupEntriesToRecordings(
  entries: TranscriptBackupEntry[],
  existingTitles: string[],
  defaultProcessingMode: Recording['processingMode'],
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

export async function exportAllTranscripts(): Promise<void> {
  const { recordings } = useRecordingStore.getState();
  const backup = buildTranscriptBackupFile(recordings);

  if (backup.recordings.length === 0) {
    Alert.alert(
      'Nothing to export',
      'There are no transcripts or summaries in your library to export.',
    );
    return;
  }

  const filename = `briefly-transcripts-${new Date().toISOString().slice(0, 10)}.json`;
  const exportFile = new File(Paths.cache, filename);
  exportFile.create({ overwrite: true, intermediates: true });
  exportFile.write(serializeTranscriptBackupFile(backup));

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    Alert.alert('Export ready', `Backup saved to:\n${exportFile.uri}`);
    return;
  }

  await Sharing.shareAsync(exportFile.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export transcripts',
    UTI: 'public.json',
  });

  logger.info('TranscriptBackup', 'Exported transcripts', {
    count: backup.recordings.length,
  });
}

export async function importTranscriptsFromPicker(): Promise<void> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    return;
  }

  const picked = new File(result.assets[0].uri);
  if (!picked.exists) {
    throw new Error('Could not read the selected file.');
  }

  const jsonText = await picked.text();
  const entries = parseTranscriptBackupJson(jsonText);

  await new Promise<void>((resolve) => {
    Alert.alert(
      'Import transcripts',
      `Import ${entries.length} transcript${entries.length === 1 ? '' : 's'}? They will appear in Imports.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve() },
        {
          text: 'Import',
          onPress: () => {
            void (async () => {
              try {
                const { recordings, importRecordings } = useRecordingStore.getState();
                const { summarizationMode } = useSettingsStore.getState();
                const incoming = backupEntriesToRecordings(
                  entries,
                  recordings.map((r) => r.title),
                  summarizationMode,
                );
                await importRecordings(incoming);
                Alert.alert(
                  'Import complete',
                  `Added ${incoming.length} transcript${incoming.length === 1 ? '' : 's'} to Imports.`,
                );
                logger.info('TranscriptBackup', 'Imported transcripts', {
                  count: incoming.length,
                });
              } catch (error: unknown) {
                const message =
                  error instanceof Error ? error.message : 'Could not import transcripts.';
                Alert.alert('Import failed', message);
              } finally {
                resolve();
              }
            })();
          },
        },
      ],
    );
  });
}
