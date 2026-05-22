import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useSettingsStore } from '@/context/useSettingsStore';
import {
  cancelRecordingBackgroundProcessing,
  startRecordingBackgroundProcessing,
} from '@/services/recording/recordingBackgroundProcessing';
import { useRecordingRetryFlashStore } from '@/context/useRecordingRetryFlashStore';
import { alertIfLocalLlmNotReady } from '@/utils/processing/localLlmSummarizationGate';
import { usePlayback } from '@/hooks/usePlayback';
import { TranscriptSegmentView } from '@/components/features/recording/TranscriptSegmentView';
import { RecordingPlaybackBar } from '@/components/features/recording/RecordingPlaybackBar';
import { StackScreenHeader } from '@/components/navigation/StackScreenHeader';
import { CircularIconButton } from '@/components/ui/CircularIconButton';
import { usePlaybackBarLayout } from '@/components/navigation/usePlaybackBarLayout';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import { useScreenLayoutStyles } from '@/components/navigation/screenLayout';
import { hasRecordingAudio } from '@/utils/recording/recordingValidation';
import { Colors, Spacing } from '@/theme';

export default function RecordingTranscriptScreen() {
  const sl = useScreenLayoutStyles();
  const { scrollPaddingTop } = useTopChromeLayout();
  const { paddingBottom: playbackBottom } = usePlaybackBarLayout();
  const router = useRouter();
  const { recordingId: recordingIdParam } = useLocalSearchParams<{ recordingId: string }>();
  const recordingId = useMemo(
    () => (Array.isArray(recordingIdParam) ? recordingIdParam[0] : recordingIdParam),
    [recordingIdParam],
  );
  const recording = useRecordingStore((s) =>
    recordingId ? s.recordings.find((r) => r.id === recordingId) : undefined,
  );

  const playback = usePlayback({
    filePath: recording?.filePath ?? '',
    transcript: recording?.transcript,
  });

  const handleRerunTranscript = useCallback(() => {
    if (!recording) return;
    if (recording.status === 'transcribing' || recording.status === 'summarizing') {
      return;
    }
    if (!recording.filePath?.trim()) {
      Alert.alert('No audio', 'No audio file is available for this recording.');
      return;
    }
    const mode = useSettingsStore.getState().summarizationMode;
    if (!alertIfLocalLlmNotReady(mode)) return;

    useRecordingRetryFlashStore.getState().markRetryPending(recording.id);
    cancelRecordingBackgroundProcessing(recording.id);
    startRecordingBackgroundProcessing(recording.id, {
      audioFallbackOnly: true,
      preservePreviousResults: true,
    });
  }, [recording]);

  if (!recording) {
    return (
      <View style={sl.container}>
        <Text style={styles.notFound}>Recording not found.</Text>
      </View>
    );
  }

  const hasAudio = hasRecordingAudio(recording.filePath, recording.fileSize);
  const segments = recording.transcript ?? [];
  const isProcessing =
    recording.status === 'transcribing' || recording.status === 'summarizing';

  return (
    <View style={sl.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: scrollPaddingTop,
            paddingBottom: hasAudio ? 160 : Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {segments.length > 0 ? (
          <View style={styles.transcriptContainer} key={segments.map((s) => s.id).join('|')}>
            {segments.map((seg) => (
              <TranscriptSegmentView
                key={seg.id}
                segment={seg}
                isActive={seg.id === playback.activeSegmentId}
              />
            ))}
          </View>
        ) : !isProcessing ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No transcript available.</Text>
          </View>
        ) : null}
      </ScrollView>

      {hasAudio ? (
        <RecordingPlaybackBar
          recording={recording}
          playback={playback}
          paddingBottom={playbackBottom}
        />
      ) : null}

      <StackScreenHeader
        title="Transcript"
        showBack
        onBack={() => router.back()}
        trailing={
          hasAudio ? (
            <CircularIconButton
              icon="refresh-outline"
              accessibilityLabel="Re-run transcription and summarization"
              loading={isProcessing}
              onPress={isProcessing ? undefined : handleRerunTranscript}
            />
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  notFound: {
    color: Colors.textPrimary,
    padding: Spacing.md,
    fontSize: 17,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: 160,
  },
  transcriptContainer: {
    marginTop: Spacing.sm,
  },
  empty: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.subtext,
    fontSize: 15,
  },
});
