import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecordingStore } from '@/features/recording/state/useRecordingStore';
import { useUserFolderStore } from '@/features/library/state/useUserFolderStore';
import { usePlayback } from '@/features/recording/hooks/usePlayback';
import { useExport } from '@/features/recording/hooks/useExport';
import { useRecordingAudioAvailability } from '@/features/recording/hooks/useRecordingAudioAvailability';
import { useRecordingManualRerun } from '@/features/recording/hooks/useRecordingManualRerun';
import { ensureUniqueTitle } from '@/shared/utils';
import { getRecordingFolderDisplayName } from '@/features/library/utils/recordingFolder';
import type { Recording } from '@/shared/types';
export function useRecordingDetail(recordingId: string | undefined) {
  const router = useRouter();
  const recording = useRecordingStore((s) =>
    recordingId ? s.recordings.find((r) => r.id === recordingId) : undefined,
  );
  const { updateRecording, recordings, restoreRecording } = useRecordingStore();
  const folders = useUserFolderStore((s) => s.folders);
  const loadFolders = useUserFolderStore((s) => s.loadFolders);
  const [renameDialogVisible, setRenameDialogVisible] = useState(false);
  useEffect(() => {
    void loadFolders();
  }, [loadFolders]);
  const folderLabel = useMemo(
    () => (recording ? getRecordingFolderDisplayName(recording, folders) : ''),
    [recording, folders],
  );
  const audioAvailability = useRecordingAudioAvailability(recording);
  const rerun = useRecordingManualRerun(recording, audioAvailability);
  const playback = usePlayback({
    filePath: audioAvailability.filePath,
    transcript: recording?.transcript,
  });
  const { shareBusy, shareMenuItems } = useExport(recording);
  const submitRename = useCallback(
    (text: string) => {
      if (!recording) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      const existingTitles = recordings.filter((r) => r.id !== recording.id).map((r) => r.title);
      void updateRecording(recording.id, { title: ensureUniqueTitle(trimmed, existingTitles) });
    },
    [recording, recordings, updateRecording],
  );
  const handleRename = useCallback(() => {
    if (!recording) return;
    if (Platform.OS === 'ios') {
      Alert.prompt('Rename Recording', undefined, submitRename, 'plain-text', recording.title);
    } else {
      setRenameDialogVisible(true);
    }
  }, [recording, submitRename]);
  const handleToggleFavorite = useCallback(() => {
    if (!recording) return;
    void updateRecording(recording.id, { isFavorite: !recording.isFavorite });
  }, [recording, updateRecording]);
  const handleViewTranscript = useCallback(() => {
    if (!recording) return;
    const isTranscribing = recording.status === 'transcribing';
    if (rerun.hasTranscript || isTranscribing || rerun.hasAudio) {
      router.push({
        pathname: '/recording/transcript',
        params: { recordingId: recording.id },
      });
      return;
    }
    if (recording.status === 'saved') {
      Alert.alert('No transcript', 'Transcribe this recording first.');
    } else {
      Alert.alert('No transcript', 'No transcript is available for this recording.');
    }
  }, [recording, rerun.hasAudio, rerun.hasTranscript, router]);
  const handleRestoreDeleted = useCallback(() => {
    if (!recording) return;
    void restoreRecording(recording.id).then(() => router.back());
  }, [recording, restoreRecording, router]);
  const overflowMenuItems = useMemo(() => {
    if (!recording) return [];
    return [
      { label: 'Rename', onPress: handleRename },
      {
        label: recording.isFavorite ? 'Unfavorite' : 'Favorite',
        onPress: handleToggleFavorite,
      },
      { label: 'View transcript', onPress: handleViewTranscript },
      {
        label: rerun.isSummarizing ? 'Summarizing…' : 'Re-run summary',
        onPress: rerun.runSummarizationOnly,
        loading: rerun.isSummarizing,
        disabled: rerun.summaryRerunDisabled,
      },
    ];
  }, [
    handleRename,
    handleToggleFavorite,
    handleViewTranscript,
    recording,
    rerun.isSummarizing,
    rerun.runSummarizationOnly,
    rerun.summaryRerunDisabled,
  ]);
  const goBack = useCallback(() => router.back(), [router]);
  return {
    recording: recording as Recording | undefined,
    folderLabel,
    audioAvailability,
    playback,
    shareBusy,
    shareMenuItems,
    renameDialogVisible,
    setRenameDialogVisible,
    submitRename,
    handleRestoreDeleted,
    overflowMenuItems,
    rerun,
    goBack,
  };
}
