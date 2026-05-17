import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useSettingsStore } from '@/context/useSettingsStore';
import { TranscriptionService } from '@/services/transcription';
import { SummarizationService } from '@/services/summarization';
import { StackScreenHeader } from '@/components/navigation/StackScreenHeader';
import { TopBlurFade } from '@/components/navigation/TopBlurFade';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import { screenLayoutStyles as sl } from '@/components/navigation/screenLayout';
import { transcriptionModeTitle } from '@/utils/transcriptionMode';
import { Colors, Spacing, BorderRadius, SliderAnimation, withAppFont } from '@/theme';

export default function SummarizingScreen() {
  const { scrollPaddingTop, topInset } = useTopChromeLayout();
  const router = useRouter();
  const { recordingId } = useLocalSearchParams<{ recordingId: string }>();
  const { getRecordingById, updateRecording } = useRecordingStore();
  const { defaultTranscriptionMode } = useSettingsStore();
  const recording = getRecordingById(recordingId!);
  const [stage, setStage] = useState<'transcribing' | 'summarizing' | 'done' | 'error'>(
    'transcribing'
  );
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
    Animated.timing(progress, {
      toValue: 0.4,
      duration: 1500,
      easing: SliderAnimation.easing,
      useNativeDriver: false,
    }).start();
    (async () => {
      try {
        await updateRecording(recordingId, { status: 'transcribing', errorMessage: undefined });
        setStage('transcribing');
        let segments = pre ?? [];
        if (!(pre && pre.length > 0)) {
          segments = await TranscriptionService.transcribe(fp, undefined, tMode);
          if (isCancelled.current) return;
        } else {
          Animated.timing(progress, {
            toValue: 0.55,
            duration: 500,
            easing: SliderAnimation.easing,
            useNativeDriver: false,
          }).start();
        }
        await updateRecording(recordingId, { status: 'summarizing', transcript: segments });
        setStage('summarizing');
        Animated.timing(progress, {
          toValue: 0.75,
          duration: 1000,
          easing: SliderAnimation.easing,
          useNativeDriver: false,
        }).start();
        const { summary, keyInsights } = await SummarizationService.summarize(segments, pMode);
        if (isCancelled.current) return;
        Animated.timing(progress, {
          toValue: 1,
          duration: 500,
          easing: SliderAnimation.easing,
          useNativeDriver: false,
        }).start();
        await updateRecording(recordingId, { status: 'ready', summary, keyInsights });
        setStage('done');
        setTimeout(() => {
          if (!isCancelled.current) router.replace(`/recording/${recordingId}`);
        }, 600);
      } catch (err: any) {
        if (isCancelled.current) return;
        setErrorMessage(err.message ?? 'Unknown error');
        setStage('error');
        const latest = getRecordingById(recordingId);
        setRetrySummaryOnly(!!(latest?.transcript && latest.transcript.length > 0));
        await updateRecording(recordingId, { status: 'error', errorMessage: err.message });
      }
    })();
    return () => {
      isCancelled.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingId]);

  const handleRetry = async () => {
    if (!recording || !recordingId) return;
    if (retrySummaryOnly || (recording.transcript?.length ?? 0) > 0) {
      await updateRecording(recordingId, {
        status: 'summarizing',
        errorMessage: undefined,
        summary: undefined,
        keyInsights: undefined,
      });
    } else {
      await updateRecording(recordingId, { status: 'transcribing', errorMessage: undefined });
    }
    hasStarted.current = false;
    isCancelled.current = false;
    setStage('transcribing');
    setErrorMessage('');
    progress.setValue(0);
    router.replace({ pathname: '/recording/summarizing', params: { recordingId } });
  };

  const handleCancel = async () => {
    if (!recordingId) return;
    isCancelled.current = true;
    await updateRecording(recordingId, { status: 'saved', errorMessage: undefined });
    router.replace('/(tabs)');
  };

  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const stageTitle = {
    transcribing: 'Transcribing...',
    summarizing: 'Generating your summary...',
    done: 'Complete!',
    error: 'Processing failed',
  }[stage];
  const stageLabel = {
    transcribing: 'Transcribing your audio...',
    summarizing: 'Analyzing key decisions and action items.',
    done: 'Done!',
    error: errorMessage || 'Something went wrong.',
  }[stage];
  const headerTitle = stage === 'transcribing' ? 'Transcribing' : 'Summarizing';

  return (
    <View style={sl.container}>
      <View style={[styles.content, { paddingTop: scrollPaddingTop }]}>
        <View style={styles.iconRing}>
          <View style={styles.iconInner}>
            {stage === 'error' ? (
              <Ionicons name="warning" size={40} color={Colors.orange} />
            ) : stage === 'done' ? (
              <Ionicons name="checkmark-circle" size={40} color={Colors.green} />
            ) : (
              <Ionicons name="sparkles" size={40} color={Colors.subtext} />
            )}
          </View>
        </View>
        <Text style={styles.title}>{stageTitle}</Text>
        <Text style={styles.subtitle}>{stageLabel}</Text>
        {stage !== 'error' ? (
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
          </View>
        ) : null}
        {recording ? (
          <View style={styles.modeBadge}>
            <Ionicons name="mic-outline" size={12} color={Colors.primary} />
            <Text style={styles.modeBadgeText}>
              {transcriptionModeTitle(recording.transcriptionMode ?? defaultTranscriptionMode)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        {stage === 'error' ? (
          <TouchableOpacity style={styles.primaryButton} onPress={handleRetry}>
            <Ionicons name="refresh" size={18} color={Colors.textPrimary} />
            <Text style={styles.primaryButtonText}>
              {retrySummaryOnly ? 'Retry Summary' : 'Retry'}
            </Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <TopBlurFade />
      <View style={[sl.headerOverlay, { paddingTop: topInset }]} pointerEvents="box-none">
        <StackScreenHeader
          title={headerTitle}
          showBack
          leadingIcon="close"
          onBack={handleCancel}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  iconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: withAppFont({
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  }),
  subtitle: withAppFont({
    fontSize: 15,
    color: Colors.subtext,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  }),
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.card,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  modeBadgeText: withAppFont({
    fontSize: 14,
    fontWeight: '500',
    color: Colors.subtext,
  }),
  actions: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardXL,
    paddingVertical: 16,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  primaryButtonText: withAppFont({
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary,
  }),
  cancelText: withAppFont({
    fontSize: 17,
    color: Colors.subtext,
  }),
});
