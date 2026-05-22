import { useCallback } from 'react';
import { useRecordingStore } from '@/context/useRecordingStore';
import { ensureUniqueTitle } from '@/utils';
import type { Recording } from '@/types';
export function useRecordingRename() {
  const recordings = useRecordingStore((s) => s.recordings);
  const updateRecording = useRecordingStore((s) => s.updateRecording);
  return useCallback(
    async (recording: Recording, newTitle: string) => {
      const trimmed = newTitle.trim();
      if (!trimmed) return;
      const existingTitles = recordings
        .filter((r) => r.id !== recording.id)
        .map((r) => r.title);
      try {
        await updateRecording(recording.id, {
          title: ensureUniqueTitle(trimmed, existingTitles),
        });
      } catch (err) {
        console.error('Failed to rename recording:', err);
      }
    },
    [recordings, updateRecording],
  );
}
