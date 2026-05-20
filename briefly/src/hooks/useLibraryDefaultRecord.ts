import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { RecordingService } from '@/services/audio';
import { ensureRecordingPrerequisites } from '@/services/audio/recordingSession';

/** Default record FAB from Library (unlisted). */
export function useLibraryDefaultRecord() {
  const router = useRouter();

  return useCallback(async () => {
    const granted = await RecordingService.requestPermissions();
    if (!granted) return;
    await ensureRecordingPrerequisites();
    router.push({ pathname: '/recording/new', params: { targetFolder: 'unlisted' } });
  }, [router]);
}
