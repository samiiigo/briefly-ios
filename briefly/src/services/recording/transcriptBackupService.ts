import { Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { useRecordingStore } from '@/context/useRecordingStore';
import {
  buildTranscriptBackupFile,
  serializeTranscriptBackupFile,
} from '@/utils/recording/transcriptBackup';
import { logger } from '@/utils/logging/logger';
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
