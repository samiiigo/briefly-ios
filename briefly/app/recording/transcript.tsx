import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TranscriptSegment } from '@/types';
import { useRecordingStore } from '@/context/useRecordingStore';
import { retranscribeRecordingFromAudio } from '@/services/recording/recordingProcessingService';
import { cancelRecordingBackgroundProcessing } from '@/services/recording/recordingBackgroundProcessing';
import { toProcessingFailure } from '@/utils/processing/processingErrors';
import { usePlayback } from '@/hooks/usePlayback';
import { TranscriptSegmentView } from '@/components/features/recording/TranscriptSegmentView';
import { RecordingPlaybackBar } from '@/components/features/recording/RecordingPlaybackBar';
import { StackScreenHeader } from '@/components/navigation/StackScreenHeader';
import { CircularIconButton } from '@/components/ui/CircularIconButton';
import { usePlaybackBarLayout } from '@/components/navigation/usePlaybackBarLayout';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import { screenLayoutStyles as sl } from '@/components/navigation/screenLayout';
import { Colors, Spacing } from '@/theme';

export default function RecordingTranscriptScreen() {
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
  const updateRecording = useRecordingStore((s) => s.updateRecording);
  const [isRerunning, setIsRerunning] = useState(false);
  const [rerunSegments, setRerunSegments] = useState<TranscriptSegment[] | null>(null);

  const playback = usePlayback({
    filePath: recording?.filePath ?? '',
    transcript: rerunSegments ?? recording?.transcript,
  });

  const handleRerunTranscript = useCallback(() => {
    if (!recording || isRerunning) return;
    if (recording.status === 'summarizing') {
      Alert.alert('Processing', 'Summarization is in progress. Wait for it to finish.');
      return;
    }
    if (!recording.filePath?.trim()) {
      Alert.alert('No audio', 'No audio file is available for this recording.');
      return;
    }

    const run = async () => {
      const previousStatus = recording.status;
      setIsRerunning(true);
      setRerunSegments([]);
      cancelRecordingBackgroundProcessing(recording.id);

      // Transcript-only: do not change status or touch summary / key insights.
      await updateRecording(recording.id, {
        transcript: undefined,
        errorMessage: undefined,
      });

      try {
        const segments = await retranscribeRecordingFromAudio(recording.filePath, {
          durationSec: recording.duration,
          fileSizeBytes: recording.fileSize,
        });
        setRerunSegments(segments);
        await updateRecording(recording.id, {
          transcript: segments,
          errorMessage: undefined,
          ...(previousStatus === 'error' ? { status: 'ready' as const } : {}),
        });
      } catch (err) {
        const failure = toProcessingFailure(err, 'transcription');
        setRerunSegments(null);
        await updateRecording(recording.id, {
          status: 'error',
          errorMessage: failure.message,
        });
        Alert.alert('Transcription failed', failure.message);
      } finally {
        setIsRerunning(false);
        setRerunSegments(null);
      }
    };
    void run();
  }, [recording, isRerunning, updateRecording]);

  if (!recording) {
    return (
      <View style={sl.container}>
        <Text style={styles.notFound}>Recording not found.</Text>
      </View>
    );
  }

  const segments = isRerunning
    ? (rerunSegments ?? [])
    : (recording?.transcript ?? []);
  const isTranscribing = isRerunning || recording.status === 'summarizing';

  return (
    <View style={sl.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: scrollPaddingTop }]}
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
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isTranscribing
                ? 'Transcribing with AssemblyAI…'
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

      <StackScreenHeader
        title="Transcript"
        showBack
        onBack={() => router.back()}
        trailing={
          <CircularIconButton
            icon="refresh-outline"
            accessibilityLabel="Re-run transcription"
            loading={isTranscribing}
            onPress={isTranscribing ? undefined : handleRerunTranscript}
          />
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
