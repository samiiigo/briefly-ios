import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useRecordingStore } from '@/features/recording/state/useRecordingStore';
import { groupRecordingsByTime, formatRecentsGroupLabel } from '@/shared/utils';
import { resolveRecordingFolder } from '@/features/library/utils/recordingFolder';
import { useRecordingRename } from '@/features/recording/hooks/useRecordingRename';
import { useSwipeableListChrome } from '@/shared/hooks/common/useSwipeableListChrome';
import type { Recording } from '@/shared/types';
import type { RecordingListGroupPosition } from '@/shared/utils/list/flattenRecordingSections';
export function useRecentsScreen() {
  const router = useRouter();
  const recordings = useRecordingStore((s) => s.recordings);
  const deleteRecording = useRecordingStore((s) => s.deleteRecording);
  const handleRename = useRecordingRename();
  const { closeOpenSwipe } = useSwipeableListChrome();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(intervalId);
  }, []);
  const visibleRecordings = useMemo(
    () =>
      recordings.filter(
        (r) => r.deletedAt == null && resolveRecordingFolder(r) !== 'archived',
      ),
    [recordings],
  );
  const sections = useMemo(() => {
    void now;
    return groupRecordingsByTime(visibleRecordings, formatRecentsGroupLabel);
  }, [visibleRecordings, now]);
  const isEmpty = visibleRecordings.length === 0;
  const renderRecording = useCallback(
    (item: Recording, groupPosition: RecordingListGroupPosition) => ({
      recording: item,
      groupPosition,
      onPress: () => router.push(`/recording/${item.id}`),
      onDelete: () => deleteRecording(item.id),
      onRename: (newTitle: string) => handleRename(item, newTitle),
    }),
    [deleteRecording, handleRename, router],
  );
  return {
    sections,
    isEmpty,
    renderRecording,
    closeOpenSwipe,
  };
}
