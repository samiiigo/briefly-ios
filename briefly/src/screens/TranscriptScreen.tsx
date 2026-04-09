import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  GestureResponderEvent,
  LayoutChangeEvent,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRecordingStore } from '../store/useRecordingStore';
import { usePlayback } from '../hooks/usePlayback';
import { useExport } from '../hooks/useExport';
import { KeyInsights } from '../components/KeyInsights';
import { TranscriptSegmentView } from '../components/TranscriptSegmentView';
import { ProcessingBadge } from '../components/ProcessingBadge';
import { RootStackParamList } from '../types';
import { useSettingsStore } from '../store/useSettingsStore';
import { transcriptionModeTitle } from '../utils/transcriptionMode';
import { formatDuration, formatDate, ensureUniqueTitle } from '../utils';
import { Colors, Spacing, BorderRadius } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Transcript'>;

export function TranscriptScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { recordingId } = route.params;
  const recording = useRecordingStore((s) => s.getRecordingById(recordingId));
  const { updateRecording, recordings, restoreRecording } = useRecordingStore();
  const { defaultTranscriptionMode } = useSettingsStore();

  // Playback hook (SRP) — all playback state and controls
  const {
    isPlaying, playbackPos, playbackDur, playbackRate, activeSegmentId,
    trackWidth, animatedProgress, cycleRate,
    togglePlayPause: handlePlayPause, seek: handleSeek, seekToRatio,
  } = usePlayback({ filePath: recording?.filePath ?? '', transcript: recording?.transcript });

  // Export hook (SRP) — PDF export and text sharing
  const { isExportingPdf, openShareMenu } = useExport(recording);

  const handleProgressTap = useCallback(
    async (e: GestureResponderEvent) => {
      if (!playbackDur || trackWidth.current === 0) return;
      const ratio = e.nativeEvent.locationX / trackWidth.current;
      await seekToRatio(ratio);
    },
    [playbackDur, seekToRatio, trackWidth]
  );

  const handleRename = useCallback(() => {
    if (!recording) return;
    const existingTitles = recordings.filter((r) => r.id !== recording.id).map((r) => r.title);
    const save = (text: string) => {
      const t = text.trim();
      if (t) updateRecording(recording.id, { title: ensureUniqueTitle(t, existingTitles) });
    };
    if (Platform.OS === 'ios') {
      Alert.prompt('Rename Recording', undefined, save, 'plain-text', recording.title);
    } else {
      Alert.alert('Rename', 'Long-press the recording card on the home screen to rename it.');
    }
  }, [recording, recordings, updateRecording]);

  const handleRetry = useCallback(async () => {
    if (!recording) return;
    const hasTranscript = (recording.transcript?.length ?? 0) > 0;
    await updateRecording(
      recording.id,
      hasTranscript
        ? {
            status: 'summarizing',
            errorMessage: undefined,
            summary: undefined,
            keyInsights: undefined,
          }
        : {
            status: 'transcribing',
            errorMessage: undefined,
            transcript: undefined,
            summary: undefined,
            keyInsights: undefined,
          }
    );
    navigation.replace('Summarizing', { recordingId: recording.id });
  }, [recording, updateRecording, navigation]);

  const handleStartProcessing = useCallback(async () => {
    if (!recording) return;
    navigation.replace('Summarizing', { recordingId: recording.id });
  }, [recording, navigation]);

  if (!recording) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: Colors.textPrimary, padding: 20 }}>Recording not found.</Text>
      </SafeAreaView>
    );
  }

  if (recording.deletedAt != null) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerDate}>{formatDate(recording.createdAt)}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.deletedOverlay}>
          <Ionicons name="trash-outline" size={48} color={Colors.textSecondary} style={{ marginBottom: 16 }} />
          <Text style={styles.deletedOverlayTitle}>Recording in Recently Deleted</Text>
          <Text style={styles.deletedOverlayMessage}>
            Restore this recording to another folder to open it or listen to it.
          </Text>
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={() => restoreRecording(recording.id).then(() => navigation.goBack())}
          >
            <Ionicons name="arrow-undo" size={20} color={Colors.textPrimary} />
            <Text style={styles.restoreButtonText}>Restore recording</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const progressFillWidth = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const progressThumbLeft = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const transcriptionModeLabel = transcriptionModeTitle(
    recording.transcriptionMode ?? defaultTranscriptionMode
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerDate}>{formatDate(recording.createdAt)}</Text>
        <TouchableOpacity onPress={handleRename} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="pencil-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{recording.title}</Text>
        <View style={styles.metaRow}>
          <ProcessingBadge mode={recording.processingMode} size="sm" />
          <Text style={styles.transcriptionMode}>
            {transcriptionModeLabel}
          </Text>
        </View>

        {/* Needs-processing banner */}
        {(recording.status === 'saved' || recording.status === 'transcribing' || recording.status === 'summarizing') && (
          <View style={styles.processingBanner}>
            <View style={styles.errorBannerTop}>
              <Ionicons name="sparkles" size={16} color={Colors.primary} />
              <Text style={styles.processingBannerTitle}>
                {recording.status === 'saved' && (recording.transcript?.length ?? 0) > 0
                  ? 'Summarization pending'
                  : recording.status === 'saved'
                    ? 'Ready to process'
                    : 'Processing incomplete'}
              </Text>
            </View>
            <Text style={styles.errorBannerMessage}>
              {recording.status === 'saved' && (recording.transcript?.length ?? 0) > 0
                ? 'Transcript is saved. Tap below to generate a summary.'
                : recording.status === 'saved'
                  ? 'Audio is saved locally. Tap below to transcribe and summarize.'
                  : 'A previous run was interrupted. Tap below to resume.'}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleStartProcessing}>
              <Ionicons
                name={
                  recording.status === 'saved' && (recording.transcript?.length ?? 0) > 0
                    ? 'document-text'
                    : 'sparkles'
                }
                size={15}
                color={Colors.textPrimary}
              />
              <Text style={styles.retryButtonText}>
                {recording.status === 'saved' && (recording.transcript?.length ?? 0) > 0
                  ? 'Run Summarization'
                  : 'Transcribe & Summarize'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error banner */}
        {recording.status === 'error' && (
          <View style={styles.errorBanner}>
            <View style={styles.errorBannerTop}>
              <Ionicons name="warning" size={16} color={Colors.orange} />
              <Text style={styles.errorBannerTitle}>Processing failed</Text>
            </View>
            {!!recording.errorMessage && (
              <Text style={styles.errorBannerMessage} numberOfLines={3}>
                {recording.errorMessage}
              </Text>
            )}
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Ionicons name="refresh" size={15} color={Colors.textPrimary} />
              <Text style={styles.retryButtonText}>
                {(recording.transcript?.length ?? 0) > 0
                  ? 'Retry Summary Processing'
                  : 'Retry Transcription & Summary'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Summary */}
        {recording.summary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>{recording.summary}</Text>
          </View>
        )}

        {/* Key Insights */}
        {recording.keyInsights && recording.keyInsights.length > 0 && (
          <KeyInsights insights={recording.keyInsights} />
        )}

        {/* Transcript */}
        {recording.transcript && recording.transcript.length > 0 ? (
          <View style={styles.transcriptContainer}>
            {recording.transcript.map((segment) => (
              <TranscriptSegmentView
                key={segment.id}
                segment={segment}
                isActive={segment.id === activeSegmentId}
              />
            ))}
          </View>
        ) : (
          <View style={styles.noTranscript}>
            <Text style={styles.noTranscriptText}>
              {recording.status === 'transcribing' || recording.status === 'summarizing'
                ? 'Processing…'
                : recording.status === 'saved'
                  ? 'Audio saved. Tap above to start transcription.'
                  : 'No transcript available.'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Playback bar */}
      <View style={styles.playbackBar}>
        {/* Progress */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleProgressTap}
          onLayout={(e: LayoutChangeEvent) => { trackWidth.current = e.nativeEvent.layout.width; }}
          style={styles.progressTrack}
        >
          <Animated.View style={[styles.progressFill, { width: progressFillWidth }]} />
          <Animated.View style={[styles.progressThumb, { left: progressThumbLeft }]} />
        </TouchableOpacity>

        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatDuration(playbackPos)}</Text>
          <Text style={styles.timeText}>{formatDuration(playbackDur || recording.duration)}</Text>
        </View>

        <View style={styles.playControls}>
          <TouchableOpacity onPress={() => handleSeek('back')}>
            <Ionicons name="play-back" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={26}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleSeek('forward')}>
            <Ionicons name="play-forward" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.rateButton} onPress={cycleRate}>
            <Text style={styles.rateText}>{playbackRate}x</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={openShareMenu}>
            <Ionicons
              name={isExportingPdf ? 'hourglass-outline' : 'share-outline'}
              size={24}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerDate: { fontSize: 14, color: Colors.textSecondary },
  deletedOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  deletedOverlayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  deletedOverlayMessage: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  restoreButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 160,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  transcriptionMode: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // Summary
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  },

  // Transcript
  transcriptContainer: {
    marginTop: Spacing.sm,
  },
  noTranscript: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  noTranscriptText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },

  // Playback bar
  playbackBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 30,
  },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: 6,
    position: 'relative',
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    top: -4.5,
    marginLeft: -6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  timeText: { fontSize: 12, color: Colors.textSecondary },
  playControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateButton: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  rateText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },

  // Needs-processing
  processingBanner: {
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(10, 132, 255, 0.35)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  processingBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Error / retry
  errorBanner: {
    backgroundColor: 'rgba(255, 159, 10, 0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 159, 10, 0.35)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  errorBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.orange,
  },
  errorBannerMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    marginTop: 4,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
