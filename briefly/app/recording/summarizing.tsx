import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRecordingStore } from '../../store/useRecordingStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { TranscriptionService } from '../../services/transcription';
import { SummarizationService } from '../../services/summarization';
import { transcriptionModeTitle } from '../../utils/transcriptionMode';
import { Colors, Spacing, BorderRadius, SliderAnimation } from '../../utils/theme';
import { logger } from '../../utils/logger';

export default function SummarizingScreen() {
  const router = useRouter();
  const { recordingId } = useLocalSearchParams<{ recordingId: string }>();
  const { getRecordingById, updateRecording } = useRecordingStore();
  const { defaultTranscriptionMode } = useSettingsStore();
  const recording = getRecordingById(recordingId!);
  const [stage, setStage] = useState<'transcribing' | 'summarizing' | 'done' | 'error'>('transcribing');
  const [progress] = useState(new Animated.Value(0));
  const [errorMessage, setErrorMessage] = useState('');
  const [retrySummaryOnly, setRetrySummaryOnly] = useState(false);
  const isCancelled = useRef(false);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current || !recordingId) return;
    const rec = getRecordingById(recordingId);
    if (!rec) return;
    hasStarted.current = true;
    const tMode = rec.transcriptionMode ?? defaultTranscriptionMode;
    const pMode = rec.processingMode;
    const fp = rec.filePath;
    const pre = rec.transcript;
    setRetrySummaryOnly(!!(pre && pre.length > 0));
    Animated.timing(progress, { toValue: 0.4, duration: 1500, easing: SliderAnimation.easing, useNativeDriver: false }).start();
    (async () => {
      try {
        await updateRecording(recordingId, { status: 'transcribing', errorMessage: undefined });
        setStage('transcribing');
        let segments = pre ?? [];
        if (!(pre && pre.length > 0)) {
          segments = await TranscriptionService.transcribe(fp, undefined, tMode);
          if (isCancelled.current) return;
        } else {
          Animated.timing(progress, { toValue: 0.55, duration: 500, easing: SliderAnimation.easing, useNativeDriver: false }).start();
        }
        await updateRecording(recordingId, { status: 'summarizing', transcript: segments });
        setStage('summarizing');
        Animated.timing(progress, { toValue: 0.75, duration: 1000, easing: SliderAnimation.easing, useNativeDriver: false }).start();
        const { summary, keyInsights } = await SummarizationService.summarize(segments, pMode);
        if (isCancelled.current) return;
        Animated.timing(progress, { toValue: 1, duration: 500, easing: SliderAnimation.easing, useNativeDriver: false }).start();
        await updateRecording(recordingId, { status: 'ready', summary, keyInsights });
        setStage('done');
        setTimeout(() => { if (!isCancelled.current) router.replace(`/recording/${recordingId}`); }, 600);
      } catch (err: any) {
        if (isCancelled.current) return;
        setErrorMessage(err.message ?? 'Unknown error'); setStage('error');
        const latest = getRecordingById(recordingId);
        setRetrySummaryOnly(!!(latest?.transcript && latest.transcript.length > 0));
        await updateRecording(recordingId, { status: 'error', errorMessage: err.message });
      }
    })();
    return () => { isCancelled.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingId]);

  const handleRetry = async () => {
    if (!recording || !recordingId) return;
    if (retrySummaryOnly || (recording.transcript?.length ?? 0) > 0) {
      await updateRecording(recordingId, { status: 'summarizing', errorMessage: undefined, summary: undefined, keyInsights: undefined });
    } else {
      await updateRecording(recordingId, { status: 'transcribing', errorMessage: undefined });
    }
    hasStarted.current = false; isCancelled.current = false; setStage('transcribing'); setErrorMessage(''); progress.setValue(0);
    router.replace({ pathname: '/recording/summarizing', params: { recordingId } });
  };

  const handleCancel = async () => {
    if (!recordingId) return;
    isCancelled.current = true;
    await updateRecording(recordingId, { status: 'saved', errorMessage: undefined });
    router.replace('/(tabs)');
  };

  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const stageTitle = { transcribing: 'Transcribing...', summarizing: 'Generating your summary...', done: 'Complete!', error: 'Processing failed' }[stage];
  const stageLabel = { transcribing: 'Transcribing your audio...', summarizing: 'Analyzing key decisions and action items.', done: 'Done!', error: errorMessage || 'Something went wrong.' }[stage];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><View style={styles.headerSide}><TouchableOpacity onPress={handleCancel} style={styles.closeBtn}><Ionicons name="close" size={24} color={Colors.textPrimary} /></TouchableOpacity></View><View style={styles.headerCenterSlot}><Text style={styles.headerTitle}>{stage === 'transcribing' ? 'Transcribing' : 'Summarizing'}</Text></View><View style={[styles.headerSide, styles.headerSideRight]} /></View>
      <View style={styles.content}>
        <View style={styles.iconCircle}>{stage === 'error' ? <Ionicons name="warning" size={48} color={Colors.orange} /> : stage === 'done' ? <Ionicons name="checkmark-circle" size={48} color={Colors.green} /> : <Ionicons name="sparkles" size={48} color={Colors.textPrimary} />}</View>
        <Text style={styles.title}>{stageTitle}</Text>
        <Text style={styles.subtitle}>{stageLabel}</Text>
        {stage !== 'error' && <View style={styles.progressTrack}><Animated.View style={[styles.progressBar, { width: progressWidth }]} /></View>}
        {recording && <View style={styles.modeBadge}><Ionicons name="lock-closed" size={12} color={Colors.green} /><Text style={styles.modeBadgeText}>{`TRANSCRIPTION: ${transcriptionModeTitle(recording.transcriptionMode ?? defaultTranscriptionMode).toUpperCase()}`}</Text></View>}
      </View>
      <View style={styles.actions}>
        {stage === 'error' && <TouchableOpacity style={styles.primaryButton} onPress={handleRetry}><Ionicons name="refresh" size={18} color="#fff" /><Text style={styles.primaryButtonText}>{retrySummaryOnly ? 'Retry Summary' : 'Retry'}</Text></TouchableOpacity>}
        <TouchableOpacity onPress={handleCancel}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screenHorizontal, paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  headerSide: { width: 40, justifyContent: 'center' }, headerSideRight: { alignItems: 'flex-end' },
  headerCenterSlot: { flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: 0 },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.screenHorizontal },
  iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(0,122,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
  progressTrack: { width: '100%', height: 4, backgroundColor: Colors.surface, borderRadius: 2, overflow: 'hidden', marginBottom: Spacing.lg },
  progressBar: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  modeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.full },
  modeBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.green, letterSpacing: 0.5 },
  actions: { paddingHorizontal: Spacing.screenHorizontal, paddingTop: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.md, alignItems: 'center' },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 16, paddingHorizontal: Spacing.xl, gap: Spacing.sm, width: '100%' },
  primaryButtonText: { fontSize: 17, fontWeight: '600', color: '#fff' },
  cancelText: { fontSize: 17, color: Colors.textSecondary },
});
