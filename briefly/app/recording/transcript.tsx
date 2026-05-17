import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRecordingStore } from '@/context/useRecordingStore';
import { usePlayback } from '@/hooks/usePlayback';
import { TranscriptSegmentView } from '@/components/features/recording/TranscriptSegmentView';
import { RecordingPlaybackBar } from '@/components/features/recording/RecordingPlaybackBar';
import { StackScreenHeader } from '@/components/navigation/StackScreenHeader';
import { PlaybackBarBlurFade } from '@/components/navigation/PlaybackBarBlurFade';
import { TopBlurFade } from '@/components/navigation/TopBlurFade';
import { usePlaybackBarLayout } from '@/components/navigation/usePlaybackBarLayout';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import { screenLayoutStyles as sl } from '@/components/navigation/screenLayout';
import { Colors, Spacing } from '@/theme';

export default function RecordingTranscriptScreen() {
  const { scrollPaddingTop, topInset } = useTopChromeLayout();
  const { paddingBottom: playbackBottom } = usePlaybackBarLayout();
  const router = useRouter();
  const { recordingId } = useLocalSearchParams<{ recordingId: string }>();
  const recording = useRecordingStore((s) => s.getRecordingById(recordingId!));
  const playback = usePlayback({
    filePath: recording?.filePath ?? '',
    transcript: recording?.transcript,
  });
  if (!recording) {
    return (
      <View style={sl.container}>
        <Text style={styles.notFound}>Recording not found.</Text>
      </View>
    );
  }

  const segments = recording.transcript ?? [];

  return (
    <View style={sl.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: scrollPaddingTop }]}
        showsVerticalScrollIndicator={false}
      >
        {segments.length > 0 ? (
          <View style={styles.transcriptContainer}>
            {segments.map((seg) => (
              <TranscriptSegmentView
                key={seg.id}
                segment={seg}
                isActive={seg.id === playback.activeSegmentId}
              />
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {recording.status === 'transcribing' || recording.status === 'summarizing'
                ? 'Processing…'
                : 'No transcript available.'}
            </Text>
          </View>
        )}
      </ScrollView>

      <RecordingPlaybackBar
        recording={recording}
        playback={playback}
        paddingBottom={playbackBottom}
      />

      <PlaybackBarBlurFade />
      <TopBlurFade />
      <View style={[sl.headerOverlay, { paddingTop: topInset }]} pointerEvents="box-none">
        <StackScreenHeader title="Transcript" showBack onBack={() => router.back()} />
      </View>
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
