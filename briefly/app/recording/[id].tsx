import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, GestureResponderEvent, LayoutChangeEvent, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRecordingStore } from '../../store/useRecordingStore';
import { usePlayback } from '../../hooks/usePlayback';
import { useExport } from '../../hooks/useExport';
import { KeyInsights } from '../../components/KeyInsights';
import { TranscriptSegmentView } from '../../components/TranscriptSegmentView';
import { ProcessingBadge } from '../../components/ProcessingBadge';
import { useSettingsStore } from '../../store/useSettingsStore';
import { transcriptionModeTitle } from '../../utils/transcriptionMode';
import { formatDuration, formatDate, ensureUniqueTitle } from '../../utils';
import { Colors, Spacing, BorderRadius } from '../../utils/theme';

export default function TranscriptScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: recordingId } = useLocalSearchParams<{ id: string }>();
  const recording = useRecordingStore((s) => s.getRecordingById(recordingId!));
  const { updateRecording, recordings, restoreRecording } = useRecordingStore();
  const { defaultTranscriptionMode } = useSettingsStore();
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

  const handleRetry = useCallback(async () => {
    if (!recording || !recordingId) return;
    const hasTranscript = (recording.transcript?.length ?? 0) > 0;
    await updateRecording(recording.id, hasTranscript ? { status: 'summarizing', errorMessage: undefined, summary: undefined, keyInsights: undefined } : { status: 'transcribing', errorMessage: undefined, transcript: undefined, summary: undefined, keyInsights: undefined });
    router.replace({ pathname: '/recording/summarizing', params: { recordingId: recording.id } });
  }, [recording, recordingId, updateRecording, router]);

  const handleStartProcessing = useCallback(async () => {
    if (!recording) return;
    router.replace({ pathname: '/recording/summarizing', params: { recordingId: recording.id } });
  }, [recording, router]);

  if (!recording) return <SafeAreaView style={st.container}><Text style={{ color: Colors.textPrimary, padding: Spacing.screenHorizontal }}>Recording not found.</Text></SafeAreaView>;

  if (recording.deletedAt != null) {
    return (
      <SafeAreaView style={st.container} edges={['top', 'left', 'right']}>
        <View style={st.header}><View style={st.headerSide}><TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={Colors.primary} /></TouchableOpacity></View><View style={st.headerCenterSlot}><Text style={st.headerDate} numberOfLines={1}>{formatDate(recording.createdAt)}</Text></View><View style={[st.headerSide, st.headerSideRight]} /></View>
        <View style={st.deletedOverlay}><Ionicons name="trash-outline" size={48} color={Colors.textSecondary} style={{ marginBottom: 16 }} /><Text style={st.deletedOverlayTitle}>Recording in Deleted</Text><Text style={st.deletedOverlayMessage}>Restore this recording to open it.</Text><TouchableOpacity style={st.restoreButton} onPress={() => restoreRecording(recording.id).then(() => router.back())}><Ionicons name="arrow-undo" size={20} color={Colors.textPrimary} /><Text style={st.restoreButtonText}>Restore recording</Text></TouchableOpacity></View>
      </SafeAreaView>
    );
  }

  const progressFillWidth = animatedProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const progressThumbLeft = animatedProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const modeLabel = transcriptionModeTitle(recording.transcriptionMode ?? defaultTranscriptionMode);

  return (
    <SafeAreaView style={st.container} edges={['top', 'left', 'right']}>
      <View style={st.header}><View style={st.headerSide}><TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={Colors.primary} /></TouchableOpacity></View><View style={st.headerCenterSlot}><Text style={st.headerDate} numberOfLines={1}>{formatDate(recording.createdAt)}</Text></View><View style={[st.headerSide, st.headerSideRight]}><TouchableOpacity onPress={handleRename} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Ionicons name="pencil-outline" size={20} color={Colors.textSecondary} /></TouchableOpacity></View></View>
      <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={st.title}>{recording.title}</Text>
        <View style={st.metaRow}><ProcessingBadge mode={recording.processingMode} size="sm" /><Text style={st.transcriptionMode}>{modeLabel}</Text></View>
        {(recording.status === 'saved' || recording.status === 'transcribing' || recording.status === 'summarizing') && (
          <View style={st.processingBanner}><View style={st.errorBannerTop}><Ionicons name="sparkles" size={16} color={Colors.primary} /><Text style={st.processingBannerTitle}>{recording.status === 'saved' && (recording.transcript?.length ?? 0) > 0 ? 'Summarization pending' : recording.status === 'saved' ? 'Ready to process' : 'Processing incomplete'}</Text></View><TouchableOpacity style={st.retryButton} onPress={handleStartProcessing}><Ionicons name="sparkles" size={15} color={Colors.textPrimary} /><Text style={st.retryButtonText}>{recording.status === 'saved' && (recording.transcript?.length ?? 0) > 0 ? 'Run Summarization' : 'Transcribe & Summarize'}</Text></TouchableOpacity></View>
        )}
        {recording.status === 'error' && (
          <View style={st.errorBanner}><View style={st.errorBannerTop}><Ionicons name="warning" size={16} color={Colors.orange} /><Text style={st.errorBannerTitle}>Processing failed</Text></View>{!!recording.errorMessage && <Text style={st.errorBannerMessage} numberOfLines={3}>{recording.errorMessage}</Text>}<TouchableOpacity style={st.retryButton} onPress={handleRetry}><Ionicons name="refresh" size={15} color={Colors.textPrimary} /><Text style={st.retryButtonText}>{(recording.transcript?.length ?? 0) > 0 ? 'Retry Summary' : 'Retry All'}</Text></TouchableOpacity></View>
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
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screenHorizontal, paddingVertical: Spacing.sm },
  headerSide: { width: 40, justifyContent: 'center' }, headerSideRight: { alignItems: 'flex-end' },
  headerCenterSlot: { flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: 0 },
  headerDate: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  deletedOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  deletedOverlayTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'center' },
  deletedOverlayMessage: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
  restoreButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surface, paddingVertical: 14, paddingHorizontal: Spacing.xl, borderRadius: BorderRadius.lg },
  restoreButtonText: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  scroll: { flex: 1 }, scrollContent: { paddingHorizontal: Spacing.screenHorizontal, paddingTop: Spacing.md, paddingBottom: 160 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  transcriptionMode: { fontSize: 12, color: Colors.textSecondary },
  summaryCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  summaryText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },
  transcriptContainer: { marginTop: Spacing.sm }, noTranscript: { padding: Spacing.xl, alignItems: 'center' },
  noTranscriptText: { color: Colors.textSecondary, fontSize: 15 },
  processingBanner: { backgroundColor: 'rgba(10,132,255,0.1)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(10,132,255,0.35)', borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, gap: 8 },
  processingBannerTitle: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  errorBanner: { backgroundColor: 'rgba(255,159,10,0.1)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,159,10,0.35)', borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, gap: 8 },
  errorBannerTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorBannerTitle: { fontSize: 14, fontWeight: '600', color: Colors.orange },
  errorBannerMessage: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  retryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, paddingVertical: 10, paddingHorizontal: Spacing.md, marginTop: 4 },
  retryButtonText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  playbackBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border, paddingHorizontal: Spacing.screenHorizontal, paddingTop: Spacing.sm },
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
