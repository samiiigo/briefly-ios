import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { exportAllTranscripts } from '@/services/recording/transcriptBackupService';
import { importFromPicker } from '@/services/recording/importRecordingService';

export function useTranscriptBackup() {
  const router = useRouter();
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
    () =>
      run(async () => {
        const result = await importFromPicker();
        if (result?.kind === 'audio') {
          router.push(`/recording/${result.recordingId}`);
        }
      }),
    [run, router],
  );

  return { busy, exportTranscripts, importTranscripts };
}
