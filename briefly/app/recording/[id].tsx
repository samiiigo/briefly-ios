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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRecordingStore } from '@/context/useRecordingStore';
import { usePlayback } from '@/hooks/usePlayback';
import { useExport } from '@/hooks/useExport';
import { KeyInsights } from '@/components/features/recording/KeyInsights';
import { TranscriptSegmentView } from '@/components/features/recording/TranscriptSegmentView';
import { CircularIconButton } from '@/components/ui/CircularIconButton';
import { AnchoredOverflowMenu } from '@/components/ui/AnchoredOverflowMenu';
import { StackScreenHeader } from '@/components/navigation/StackScreenHeader';
import { TopBlurFade } from '@/components/navigation/TopBlurFade';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import { screenLayoutStyles as sl } from '@/components/navigation/screenLayout';
import { useSettingsStore } from '@/context/useSettingsStore';
import { formatDuration, formatDate, ensureUniqueTitle } from '@/utils';
import { getNextSummarizationFallback } from '@/utils/summarizationFallback';
import { hasMeaningfulTranscript } from '@/utils/recordingValidation';
import { Colors, Spacing, BorderRadius, withAppFont } from '@/theme';

export default function TranscriptScreen() {
  const { scrollPaddingTop, topInset } = useTopChromeLayout();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: recordingId } = useLocalSearchParams<{ id: string }>();
  const recording = useRecordingStore((s) => s.getRecordingById(recordingId!));
  const { updateRecording, recordings, restoreRecording } = useRecordingStore();
  const { summarizationMode } = useSettingsStore();
  const { isPlaying, playbackPos, playbackDur, playbackRate, activeSegmentId, trackWidth, animatedProgress, cycleRate, togglePlayPause: handlePlayPause, seek: handleSeek, seekToRatio } = usePlayback({ filePath: recording?.filePath ?? '', transcript: recording?.transcript });
  const { isExportingPdf, openShareMenu } = useExport(recording);

  const handleProgressTap = useCallback(async (e: GestureResponderEvent) => {
    if (!playbackDur || trackWidth.current === 0) return;
    await seekToRatio(e.nativeEvent.locationX / trackWidth.current);
  }, [playbackDur, seekToRatio, trackWidth]);

  const handleRename = useCallback(() => {
    if (!recording) return;
    const existingTitles = recordings.filter((r) => r.id !== recording.id).map((r) => r.title);
    const save = (text: string) => { const t = text.trim(); if (t) updateRecording(recording.id, { title: ensureUniqueTitle(t, existingTitles) }); };
    if (Platform.OS === 'ios') { Alert.prompt('Rename Recording', undefined, save, 'plain-text', recording.title); }
    else { Alert.alert('Rename', 'Long-press the recording card on the home screen to rename it.'); }
  }, [recording, recordings, updateRecording]);

  const handleTranscriptionFallback = useCallback(async () => {
    if (!recording || !recordingId) return;
    const { summarizationMode: activeSummarizationMode } = useSettingsStore.getState();
    await updateRecording(recording.id, {
      status: 'transcribing',
      errorMessage: undefined,
      transcript: undefined,
      summary: undefined,
      keyInsights: undefined,
      processingMode: activeSummarizationMode,
    });
    router.replace({
      pathname: '/recording/summarizing',
      params: { recordingId: recording.id, forceAudioFallback: 'true' },
    });
  }, [recording, recordingId, updateRecording, router]);

  const handleSummarizationFallback = useCallback(
    async (mode: typeof summarizationMode) => {
      if (!recording || !recordingId) return;
      await updateRecording(recording.id, {
        status: 'summarizing',
        errorMessage: undefined,
        summary: undefined,
        keyInsights: undefined,
        processingMode: mode,
      });
      router.replace({
        pathname: '/recording/summarizing',
        params: { recordingId: recording.id, retrySummarizationMode: mode },
      });
    },
    [recording, recordingId, updateRecording, router],
  );

  const handleStartProcessing = useCallback(async () => {
    if (!recording) return;
    router.replace({ pathname: '/recording/summarizing', params: { recordingId: recording.id } });
  }, [recording, router]);

  const handleRerunSummarization = useCallback(async () => {
    if (!recording || !recordingId) return;
    if (!hasMeaningfulTranscript(recording.transcript)) {
      Alert.alert(
        'No transcript',
        'There is no transcript to summarize. Transcribe this recording first.',
      );
      return;
    }
    const mode = useSettingsStore.getState().summarizationMode;
    await updateRecording(recording.id, {
      status: 'summarizing',
      errorMessage: undefined,
      summary: undefined,
      keyInsights: undefined,
      processingMode: mode,
    });
    router.replace({
      pathname: '/recording/summarizing',
      params: { recordingId: recording.id, retrySummarizationMode: mode },
    });
  }, [recording, recordingId, updateRecording, router]);

  if (!recording) {
    return (
      <View style={sl.container}>
        <Text style={st.notFound}>Recording not found.</Text>
      </View>
    );
  }

  if (recording.deletedAt != null) {
    return (
      <View style={sl.container}>
        <View style={[st.deletedOverlay, { paddingTop: scrollPaddingTop }]}>
          <Ionicons name="trash-outline" size={48} color={Colors.subtext} style={{ marginBottom: 16 }} />
          <Text style={st.deletedOverlayTitle}>Recording in Deleted</Text>
          <Text style={st.deletedOverlayMessage}>
            Restore this recording to open it.
          </Text>
          <TouchableOpacity
            style={st.restoreButton}
            onPress={() => restoreRecording(recording.id).then(() => router.back())}
          >
            <Ionicons name="arrow-undo" size={20} color={Colors.textPrimary} />
            <Text style={st.restoreButtonText}>Restore recording</Text>
          </TouchableOpacity>
        </View>
        <TopBlurFade />
        <View style={[sl.headerOverlay, { paddingTop: topInset }]} pointerEvents="box-none">
          <StackScreenHeader title="Deleted" showBack onBack={() => router.back()} />
        </View>
      </View>
    );
  }

  const progressFillWidth = animatedProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const progressThumbLeft = animatedProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const lastSummarizationMode = recording.processingMode ?? summarizationMode;
  const summarizationFallback =
    recording.status === 'error' && hasMeaningfulTranscript(recording.transcript)
      ? getNextSummarizationFallback(lastSummarizationMode, [lastSummarizationMode])
      : null;
  const showTranscriptionFallbackOnError =
    recording.status === 'error' &&
    (!hasMeaningfulTranscript(recording.transcript) || !summarizationFallback);

  return (
    <View style={sl.container}>
      <ScrollView
        style={st.scroll}
        contentContainerStyle={[st.scrollContent, { paddingTop: scrollPaddingTop }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={st.dateLabel}>{formatDate(recording.createdAt)}</Text>
        {(recording.status === 'saved' || recording.status === 'transcribing' || recording.status === 'summarizing') && (
          <View style={st.processingBanner}><View style={st.errorBannerTop}><Ionicons name="sparkles" size={16} color={Colors.primary} /><Text style={st.processingBannerTitle}>{recording.status === 'saved' && (recording.transcript?.length ?? 0) > 0 ? 'Summarization pending' : recording.status === 'saved' ? 'Ready to process' : 'Processing incomplete'}</Text></View><TouchableOpacity style={st.retryButton} onPress={handleStartProcessing}><Ionicons name="sparkles" size={15} color={Colors.textPrimary} /><Text style={st.retryButtonText}>{recording.status === 'saved' && (recording.transcript?.length ?? 0) > 0 ? 'Run Summarization' : 'Transcribe & Summarize'}</Text></TouchableOpacity></View>
        )}
        {recording.status === 'error' && (
          <View style={st.errorBanner}>
            <View style={st.errorBannerTop}>
              <Ionicons name="warning" size={16} color={Colors.orange} />
              <Text style={st.errorBannerTitle}>Processing failed</Text>
            </View>
            {!!recording.errorMessage && (
              <Text style={st.errorBannerMessage} numberOfLines={4}>
                {recording.errorMessage}
              </Text>
            )}
            {summarizationFallback ? (
              <TouchableOpacity
                style={st.retryButton}
                onPress={() => handleSummarizationFallback(summarizationFallback.mode)}
              >
                <Ionicons name="sparkles" size={15} color={Colors.textPrimary} />
                <Text style={st.retryButtonText}>{summarizationFallback.buttonLabel}</Text>
              </TouchableOpacity>
            ) : null}
            {showTranscriptionFallbackOnError ? (
              <TouchableOpacity style={st.retryButton} onPress={handleTranscriptionFallback}>
                <Ionicons name="mic-outline" size={15} color={Colors.textPrimary} />
                <Text style={st.retryButtonText}>Transcribe from recording</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
        {recording.summary && <View style={st.summaryCard}><Text style={st.summaryText}>{recording.summary}</Text></View>}
        {recording.keyInsights && recording.keyInsights.length > 0 && <KeyInsights insights={recording.keyInsights} />}
        {recording.transcript && recording.transcript.length > 0 ? (
          <View style={st.transcriptContainer}>{recording.transcript.map((seg) => <TranscriptSegmentView key={seg.id} segment={seg} isActive={seg.id === activeSegmentId} />)}</View>
        ) : (
          <View style={st.noTranscript}><Text style={st.noTranscriptText}>{recording.status === 'transcribing' || recording.status === 'summarizing' ? 'Processing…' : recording.status === 'saved' ? 'Tap above to start.' : 'No transcript available.'}</Text></View>
        )}
      </ScrollView>
      <View style={[st.playbackBar, { paddingBottom: Math.max(insets.bottom, 12) + Spacing.sm }]}>
        <TouchableOpacity activeOpacity={1} onPress={handleProgressTap} onLayout={(e: LayoutChangeEvent) => { trackWidth.current = e.nativeEvent.layout.width; }} style={st.progressTrack}><Animated.View style={[st.progressFill, { width: progressFillWidth }]} /><Animated.View style={[st.progressThumb, { left: progressThumbLeft }]} /></TouchableOpacity>
        <View style={st.timeRow}><Text style={st.timeText}>{formatDuration(playbackPos)}</Text><Text style={st.timeText}>{formatDuration(playbackDur || recording.duration)}</Text></View>
        <View style={st.playControls}>
          <TouchableOpacity onPress={() => handleSeek('back')}><Ionicons name="play-back" size={28} color={Colors.textPrimary} /></TouchableOpacity>
          <TouchableOpacity style={st.playButton} onPress={handlePlayPause}><Ionicons name={isPlaying ? 'pause' : 'play'} size={26} color={Colors.textPrimary} /></TouchableOpacity>
          <TouchableOpacity onPress={() => handleSeek('forward')}><Ionicons name="play-forward" size={28} color={Colors.textPrimary} /></TouchableOpacity>
          <TouchableOpacity style={st.rateButton} onPress={cycleRate}><Text style={st.rateText}>{playbackRate}x</Text></TouchableOpacity>
          <TouchableOpacity onPress={openShareMenu}><Ionicons name={isExportingPdf ? 'hourglass-outline' : 'share-outline'} size={24} color={Colors.textPrimary} /></TouchableOpacity>
        </View>
      </View>

      <TopBlurFade />
      <View style={[sl.headerOverlay, { paddingTop: topInset }]} pointerEvents="box-none">
        <StackScreenHeader
          title={recording.title}
          showBack
          onBack={() => router.back()}
          trailing={
            <AnchoredOverflowMenu
              items={[
                { label: 'Rename', onPress: handleRename },
                {
                  label: 'Rerun summarization',
                  onPress: () => {
                    void handleRerunSummarization();
                  },
                },
              ]}
              renderTrigger={(open) => (
                <CircularIconButton
                  icon="ellipsis-horizontal"
                  accessibilityLabel="Recording options"
                  onPress={open}
                />
              )}
            />
          }
        />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  notFound: withAppFont({
    color: Colors.textPrimary,
    padding: Spacing.md,
    fontSize: 17,
  }),
  deletedOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  deletedOverlayTitle: withAppFont({
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  }),
  deletedOverlayMessage: withAppFont({
    fontSize: 15,
    color: Colors.subtext,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  }),
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.cardXL,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  restoreButtonText: withAppFont({
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
  }),
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 160,
  },
  title: withAppFont({
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  }),
  dateLabel: withAppFont({
    fontSize: 14,
    color: Colors.subtext,
    marginBottom: Spacing.md,
  }),
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardXL,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryText: withAppFont({
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  }),
  transcriptContainer: { marginTop: Spacing.sm },
  noTranscript: { padding: Spacing.xl, alignItems: 'center' },
  noTranscriptText: withAppFont({
    color: Colors.subtext,
    fontSize: 15,
  }),
  processingBanner: {
    backgroundColor: 'rgba(10,132,255,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(10,132,255,0.35)',
    borderRadius: BorderRadius.cardXL,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  processingBannerTitle: withAppFont({
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  }),
  errorBanner: {
    backgroundColor: 'rgba(255,159,10,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,159,10,0.35)',
    borderRadius: BorderRadius.cardXL,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  errorBannerTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorBannerTitle: withAppFont({
    fontSize: 14,
    fontWeight: '600',
    color: Colors.orange,
  }),
  errorBannerMessage: withAppFont({
    fontSize: 13,
    color: Colors.subtext,
    lineHeight: 18,
  }),
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    marginTop: 4,
  },
  retryButtonText: withAppFont({
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  }),
  playbackBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  progressTrack: { height: 3, backgroundColor: Colors.border, borderRadius: 2, marginBottom: 6, position: 'relative' },
  progressFill: { height: 3, backgroundColor: Colors.primary, borderRadius: 2 },
  progressThumb: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary, top: -4.5, marginLeft: -6 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  timeText: { fontSize: 12, color: Colors.textSecondary },
  playControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xl },
  playButton: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  rateButton: { backgroundColor: Colors.surfaceElevated, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.sm },
  rateText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
});
