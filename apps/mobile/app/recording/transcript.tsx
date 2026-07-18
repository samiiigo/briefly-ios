import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { isRecordingProcessing } from '@/features/recording/utils/recordingContentEmoji';
import { hasMeaningfulTranscript } from '@/features/recording/utils/recordingValidation';
import { TranscriptSegmentView } from '@/features/recording/components/TranscriptSegmentView';
import { RecordingPlaybackBar } from '@/features/recording/components/RecordingPlaybackBar';
import { StackScreenHeader } from '@/navigation/header/StackScreenHeader';
import { CircularIconButton } from '@/shared/components/ui/CircularIconButton';
import { usePlaybackBarLayout } from '@/navigation/layout/usePlaybackBarLayout';
import { useTopChromeLayout } from '@/navigation/layout/useTopChromeLayout';
import { useScreenLayoutStyles } from '@/navigation/layout/screenLayout';
import { RecordingProcessingFlashIcon } from '@/features/recording/components/RecordingProcessingFlashIcon';
import { useTranscriptScreen } from '@/features/recording/hooks/useTranscriptScreen';
import { Colors, Spacing } from '@/shared/theme';

export default function RecordingTranscriptScreen() {
  const sl = useScreenLayoutStyles();
  const { scrollPaddingTop } = useTopChromeLayout();
  const { paddingBottom: playbackBottom } = usePlaybackBarLayout();
  const { recordingId: recordingIdParam } = useLocalSearchParams<{ recordingId: string }>();
  const {
    router,
    recording,
    playback,
    rerun,
    rerunDisabled,
    handleRerun,
    rerunAccessibilityLabel,
  } = useTranscriptScreen(recordingIdParam);

  if (!recording) {
    return (
      <View style={sl.container}>
        <Text style={styles.notFound}>Recording not found.</Text>
      </View>
    );
  }

  const isProcessing = isRecordingProcessing(recording);
  const hasTranscript = hasMeaningfulTranscript(recording.transcript);
  const hasAudio = rerun.hasAudio;
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
            {rerun.flashActive ? (
              <View style={styles.rerunFlashWrap}>
                <RecordingProcessingFlashIcon size={22} />
              </View>
            ) : (
              <CircularIconButton
                icon="refresh-outline"
                accessibilityLabel={rerunAccessibilityLabel}
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
