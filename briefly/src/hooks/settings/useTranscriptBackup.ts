import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { exportAllTranscripts } from '@/services/recording/transcriptBackupService';
import { importFromPicker } from '@/services/recording/importRecordingService';
export function useTranscriptBackup() {
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (task: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await task();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      Alert.alert('Error', message);
    } finally {
      setBusy(false);
    }
  }, [busy]);
  const exportTranscripts = useCallback(
    () => run(exportAllTranscripts),
    [run],
  );
  const importTranscripts = useCallback(
    () => run(async () => { await importFromPicker(); }),
    [run],
  );
  return { busy, exportTranscripts, importTranscripts };
}
