import { useRecordingRetryFlashStore } from '@/context/useRecordingRetryFlashStore';

/** Whether the post-retry flash animation is active for a recording. */
export function useRecordingRetryFlashActive(recordingId: string | undefined): boolean {
  return useRecordingRetryFlashStore((s) => {
    if (!recordingId) return false;
    const until = s.flashUntilById[recordingId];
    return until != null && Date.now() < until;
  });
}
