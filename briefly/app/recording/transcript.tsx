import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useSettingsStore } from '@/context/useSettingsStore';
import {
  runTranscriptScreenRerunFromAudio,
  TRANSCRIPT_SCREEN_RERUN_FROM_AUDIO_LABEL,
} from '@/utils/recording/recordingRerunCapabilities';
import { useRecordingRetryFlashActive } from '@/hooks/useRecordingRetryFlashActive';
import { useRecordingRetryFlashStore } from '@/context/useRecordingRetryFlashStore';
import { isRecordingProcessing } from '@/utils/recording/recordingContentEmoji';
import { hasMeaningfulTranscript } from '@/utils/recording/recordingValidation';
import { alertIfLocalLlmNotReady } from '@/utils/processing/localLlmSummarizationGate';
import { usePlayback } from '@/hooks/usePlayback';
import { TranscriptSegmentView } from '@/components/features/recording/TranscriptSegmentView';
import { RecordingPlaybackBar } from '@/components/features/recording/RecordingPlaybackBar';
import { StackScreenHeader } from '@/components/navigation/StackScreenHeader';
import { CircularIconButton } from '@/components/ui/CircularIconButton';
import { usePlaybackBarLayout } from '@/components/navigation/usePlaybackBarLayout';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import { useScreenLayoutStyles } from '@/components/navigation/screenLayout';
import { useRecordingAudioAvailability } from '@/hooks/useRecordingAudioAvailability';
import { RecordingProcessingFlashIcon } from '@/components/features/recording/RecordingProcessingFlashIcon';
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
  const flashActive = useRecordingRetryFlashActive(recordingId);

  const audioAvailability = useRecordingAudioAvailability(recording);
  const playback = usePlayback({
    filePath: audioAvailability.filePath,
    transcript: recording?.transcript,
  });

  const isProcessing = recording != null && isRecordingProcessing(recording);
  const hasTranscript = hasMeaningfulTranscript(recording?.transcript);
  const canRerunFromAudio = audioAvailability.hasAudio;
  const rerunDisabled =
    !recording || isProcessing || flashActive || !canRerunFromAudio;

  const handleRerun = useCallback(() => {
    if (rerunDisabled || !recording) return;

    const mode = useSettingsStore.getState().summarizationMode;
    if (!alertIfLocalLlmNotReady(mode)) return;

    useRecordingRetryFlashStore.getState().markRetryPending(recording.id);

    if (runTranscriptScreenRerunFromAudio(recording, audioAvailability) === 'none') {
      Alert.alert(
        'No audio',
        'No recording file is available on this device to transcribe.',
      );
    }
  }, [audioAvailability, recording, rerunDisabled]);

  if (!recording) {
    return (
      <View style={sl.container}>
        <Text style={styles.notFound}>Recording not found.</Text>
      </View>
    );
  }

  const hasAudio = canRerunFromAudio;
  const segments = recording.transcript ?? [];

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
        {hasTranscript ? (
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
          <View>
            {flashActive ? (
              <View style={styles.rerunFlashWrap}>
                <RecordingProcessingFlashIcon size={22} />
              </View>
            ) : (
              <CircularIconButton
                icon="refresh-outline"
                accessibilityLabel={TRANSCRIPT_SCREEN_RERUN_FROM_AUDIO_LABEL}
                loading={isProcessing}
                disabled={rerunDisabled}
                onPress={rerunDisabled ? undefined : handleRerun}
              />
            )}
          </View>
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
  rerunFlashWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
