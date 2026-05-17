import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useSettingsStore } from '@/context/useSettingsStore';
import {
  processRecordingFromSavedAudio,
  processRecordingToReady,
  retrySummarization,
} from '@/services/recording/recordingProcessingService';
import { ProcessingMode } from '@/types';
import { StackScreenHeader } from '@/components/navigation/StackScreenHeader';
import { TopBlurFade } from '@/components/navigation/TopBlurFade';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import { screenLayoutStyles as sl } from '@/components/navigation/screenLayout';
import {
  normalizeTranscriptionMode,
  resolvePostRecordingPipeline,
  transcriptionModeTitle,
} from '@/utils/transcriptionMode';
import { processingModeTitle } from '@/utils/processingMode';
import { isDebugMode } from '@/utils/debugMode';
import { ProcessingFailure, toProcessingFailure } from '@/utils/processingErrors';
import {
  getNextSummarizationFallback,
  summarizationRetryProgressLabel,
} from '@/utils/summarizationFallback';
import {
  hasMeaningfulTranscript,
  isRecordingFileMissing,
  isRecordingTooShort,
} from '@/utils/recordingValidation';
import { useAppInterruptGuard } from '@/hooks/useAppInterruptGuard';
import { Colors, Spacing, BorderRadius, SliderAnimation, withAppFont } from '@/theme';

type Stage = 'transcribing' | 'summarizing' | 'done' | 'error';
type FailurePhase = 'transcription' | 'summarization';

/** Failsafe so the UI never spins indefinitely on a stuck network job. */
const PROCESSING_TIMEOUT_MS = 12 * 60 * 1000;

export default function SummarizingScreen() {
  const { scrollPaddingTop, topInset } = useTopChromeLayout();
  const router = useRouter();
  const { recordingId, forceAudioFallback, retrySummarizationMode } = useLocalSearchParams<{
    recordingId: string;
    forceAudioFallback?: string;
    retrySummarizationMode?: string;
  }>();
  const { getRecordingById, updateRecording } = useRecordingStore();
  const { transcriptionMode: settingsTranscriptionMode, summarizationMode } = useSettingsStore();
  const recording = getRecordingById(recordingId!);

  const useAudioFallbackOnly = forceAudioFallback === 'true';
  const initialPipeline = resolvePostRecordingPipeline(
    settingsTranscriptionMode,
    useAudioFallbackOnly ? undefined : recording?.transcript,
  );
  const [stage, setStage] = useState<Stage>(
    useAudioFallbackOnly || !initialPipeline.skipAsyncTranscription ? 'transcribing' : 'summarizing',
  );
  const [progress] = useState(
    () =>
      new Animated.Value(
        useAudioFallbackOnly ? 0 : initialPipeline.skipAsyncTranscription ? 0.55 : 0,
      ),
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryLabel, setRetryLabel] = useState<string | null>(null);
  const [failurePhase, setFailurePhase] = useState<FailurePhase | null>(null);
  const [lastFailedSummarizationMode, setLastFailedSummarizationMode] =
    useState<ProcessingMode>(summarizationMode);
  const [attemptedSummarizationModes, setAttemptedSummarizationModes] = useState<
    ProcessingMode[]
  >([]);
  const [backgroundNote, setBackgroundNote] = useState<string | null>(null);
  const isCancelled = useRef(false);
  const hasStarted = useRef(false);
  const stageRef = useRef<Stage>(stage);

  stageRef.current = stage;

  useAppInterruptGuard({
    enabled: stage !== 'done' && stage !== 'error',
    onBackground: () => {
      setBackgroundNote('Processing continues in the background. Keep the app open if possible.');
    },
    onForeground: () => {
      setBackgroundNote(null);
    },
  });

  const registerSummarizationAttempt = useCallback((mode: ProcessingMode) => {
    setAttemptedSummarizationModes((prev) => (prev.includes(mode) ? prev : [...prev, mode]));
    setLastFailedSummarizationMode(mode);
  }, []);

  const failProcessing = useCallback(
    async (err: unknown, attemptedMode?: ProcessingMode) => {
      if (isCancelled.current || !recordingId) return;

      const rec = getRecordingById(recordingId);
      const failure = toProcessingFailure(
        err,
        hasMeaningfulTranscript(rec?.transcript) && stageRef.current === 'summarizing'
          ? 'summarization'
          : 'transcription',
        attemptedMode,
      );

      if (failure.phase === 'summarization') {
        const mode =
          failure.summarizationMode ??
          attemptedMode ??
          useSettingsStore.getState().summarizationMode;
        registerSummarizationAttempt(mode);
      }

      setFailurePhase(failure.phase);
      setErrorMessage(failure.message);
      setStage('error');
      setIsRetrying(false);
      setRetryLabel(null);

      try {
        await updateRecording(recordingId, { status: 'error', errorMessage: failure.message });
      } catch {
        // UI still shows error even if persistence fails
      }
    },
    [getRecordingById, recordingId, registerSummarizationAttempt, updateRecording],
  );

  const animateToSummarizing = useCallback(() => {
    Animated.timing(progress, {
      toValue: 0.75,
      duration: 800,
      easing: SliderAnimation.easing,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const runProcessing = useCallback(
    async (options: { audioFallbackOnly: boolean }) => {
      if (!recordingId) return;
      const rec = getRecordingById(recordingId);
      if (!rec) {
        throw new Error('Recording not found.');
      }

      const asset = {
        durationSec: rec.duration,
        filePath: rec.filePath,
        fileSizeBytes: rec.fileSize,
      };
      if (isRecordingFileMissing(asset)) {
        throw new Error('No audio file was saved for this recording.');
      }
      if (!options.audioFallbackOnly && isRecordingTooShort(asset)) {
        throw new Error(
          'Recording is too short or empty. Record for at least one second and try again.',
        );
      }

      const settingsMode = normalizeTranscriptionMode(
        useSettingsStore.getState().transcriptionMode,
      );
      const pMode = useSettingsStore.getState().summarizationMode;
      const existingTranscript = options.audioFallbackOnly ? undefined : rec.transcript;
      const meta = { durationSec: rec.duration, fileSizeBytes: rec.fileSize };

      const callbacks = {
        onStage: (nextStage: 'transcribing' | 'summarizing') => {
          if (isCancelled.current) return;
          setStage(nextStage);
          if (nextStage === 'summarizing') animateToSummarizing();
        },
        onTranscriptReady: async (segments: NonNullable<typeof rec.transcript>) => {
          if (isCancelled.current) return;
          await updateRecording(recordingId, {
            status: 'summarizing',
            transcript: segments,
            transcriptionMode: settingsMode,
            processingMode: pMode,
            errorMessage: undefined,
          });
        },
      };

      if (options.audioFallbackOnly) {
        await updateRecording(recordingId, {
          status: 'transcribing',
          errorMessage: undefined,
          processingMode: pMode,
          transcriptionMode: settingsMode,
          transcript: undefined,
          summary: undefined,
          keyInsights: undefined,
        });
        return processRecordingFromSavedAudio(pMode, rec.filePath, callbacks, meta);
      }

      const pipeline = resolvePostRecordingPipeline(settingsMode, existingTranscript);
      if (pipeline.skipAsyncTranscription) {
        await updateRecording(recordingId, {
          status: 'summarizing',
          errorMessage: undefined,
          processingMode: pMode,
          transcriptionMode: settingsMode,
          transcript: rec.transcript,
        });
      } else {
        await updateRecording(recordingId, {
          status: 'transcribing',
          errorMessage: undefined,
          processingMode: pMode,
          transcriptionMode: settingsMode,
        });
      }

      return processRecordingToReady(
        settingsMode,
        pMode,
        rec.filePath,
        existingTranscript,
        callbacks,
        meta,
      );
    },
    [animateToSummarizing, getRecordingById, recordingId, updateRecording],
  );

  const completeProcessing = useCallback(
    async (
      result: Awaited<ReturnType<typeof processRecordingToReady>>,
      processingModeUsed?: ProcessingMode,
    ) => {
      if (!recordingId || isCancelled.current) return;

      Animated.timing(progress, {
        toValue: 1,
        duration: 500,
        easing: SliderAnimation.easing,
        useNativeDriver: false,
      }).start();

      const modeUsed = processingModeUsed ?? useSettingsStore.getState().summarizationMode;

      await updateRecording(recordingId, {
        status: 'ready',
        summary: result.summary,
        keyInsights: result.keyInsights,
        processingMode: modeUsed,
        errorMessage: undefined,
      });

      setStage('done');
      setIsRetrying(false);
      setRetryLabel(null);
      setFailurePhase(null);
      setTimeout(() => {
        if (!isCancelled.current) router.replace(`/recording/${recordingId}`);
      }, 600);
    },
    [progress, recordingId, router, updateRecording],
  );

  const runSummarizationOnly = useCallback(
    async (mode: ProcessingMode) => {
      if (!recordingId) return;
      const rec = getRecordingById(recordingId);
      if (!rec?.transcript || !hasMeaningfulTranscript(rec.transcript)) {
        throw new Error('No transcript available to summarize.');
      }

      setStage('summarizing');
      progress.setValue(0.55);
      setAttemptedSummarizationModes((prev) => (prev.includes(mode) ? prev : [...prev, mode]));

      await updateRecording(recordingId, {
        status: 'summarizing',
        errorMessage: undefined,
        summary: undefined,
        keyInsights: undefined,
        processingMode: mode,
      });

      const { summary, keyInsights } = await retrySummarization(rec.transcript, mode, {
        onStage: (nextStage) => {
          if (isCancelled.current) return;
          setStage(nextStage);
          if (nextStage === 'summarizing') animateToSummarizing();
        },
      });

      await completeProcessing(
        { segments: rec.transcript, summary, keyInsights, usedAudioFallback: false },
        mode,
      );
    },
    [animateToSummarizing, completeProcessing, getRecordingById, progress, recordingId, updateRecording],
  );

  useEffect(() => {
    if (hasStarted.current || !recordingId) return;

    const rec = getRecordingById(recordingId);
    if (!rec) {
      hasStarted.current = true;
      void failProcessing(new Error('Recording not found.'));
      return;
    }

    hasStarted.current = true;
    isCancelled.current = false;

    if (retrySummarizationMode) {
      const mode = retrySummarizationMode as ProcessingMode;
      if (rec.processingMode) {
        setLastFailedSummarizationMode(rec.processingMode);
        setAttemptedSummarizationModes([rec.processingMode]);
      }
      setFailurePhase('summarization');
      setStage('summarizing');
      progress.setValue(0.55);

      (async () => {
        try {
          await runSummarizationOnly(mode);
        } catch (err: unknown) {
          await failProcessing(err, mode);
        }
      })();

      return () => {
        isCancelled.current = true;
      };
    }

    if (useAudioFallbackOnly) {
      setStage('transcribing');
      progress.setValue(0);
    } else {
      const pipeline = resolvePostRecordingPipeline(
        normalizeTranscriptionMode(useSettingsStore.getState().transcriptionMode),
        rec.transcript,
      );
      if (pipeline.skipAsyncTranscription) {
        setStage('summarizing');
        progress.setValue(0.55);
      } else {
        setStage('transcribing');
        progress.setValue(0);
        Animated.timing(progress, {
          toValue: 0.4,
          duration: 1500,
          easing: SliderAnimation.easing,
          useNativeDriver: false,
        }).start();
      }
    }

    const timeoutId = setTimeout(() => {
      if (isCancelled.current) return;
      if (stageRef.current === 'done' || stageRef.current === 'error') return;
      void failProcessing(
        new Error(
          'Processing is taking longer than expected. Check your connection and try transcribing from the recording.',
        ),
      );
    }, PROCESSING_TIMEOUT_MS);

    (async () => {
      try {
        const result = await runProcessing({ audioFallbackOnly: useAudioFallbackOnly });
        if (!result) return;
        await completeProcessing(result);
      } catch (err: unknown) {
        await failProcessing(err);
      }
    })();

    return () => {
      isCancelled.current = true;
      clearTimeout(timeoutId);
    };
  }, [
    completeProcessing,
    failProcessing,
    getRecordingById,
    progress,
    recordingId,
    runProcessing,
    runSummarizationOnly,
    retrySummarizationMode,
    useAudioFallbackOnly,
  ]);

  const summarizationFallbackAction =
    failurePhase === 'summarization'
      ? getNextSummarizationFallback(
          lastFailedSummarizationMode,
          attemptedSummarizationModes,
        )
      : null;

  const showTranscriptionFallback =
    failurePhase === 'transcription' ||
    !hasMeaningfulTranscript(recording?.transcript);

  const handleTranscriptionFallbackRetry = async () => {
    if (!recordingId || isRetrying) return;
    setIsRetrying(true);
    setRetryLabel('Transcribing recording…');
    setErrorMessage('');
    setFailurePhase(null);
    setStage('transcribing');
    progress.setValue(0);
    isCancelled.current = false;

    Animated.timing(progress, {
      toValue: 0.4,
      duration: 800,
      easing: SliderAnimation.easing,
      useNativeDriver: false,
    }).start();

    try {
      const result = await runProcessing({ audioFallbackOnly: true });
      if (!result) return;
      await completeProcessing(result);
    } catch (err: unknown) {
      await failProcessing(err);
    }
  };

  const handleSummarizationFallbackRetry = async () => {
    if (!recordingId || isRetrying || !summarizationFallbackAction) return;

    const { mode } = summarizationFallbackAction;
    const rec = getRecordingById(recordingId);
    if (!rec?.transcript || !hasMeaningfulTranscript(rec.transcript)) {
      await handleTranscriptionFallbackRetry();
      return;
    }

    setIsRetrying(true);
    setRetryLabel(summarizationRetryProgressLabel(mode));
    setErrorMessage('');
    setFailurePhase('summarization');
    setStage('summarizing');
    progress.setValue(0.55);
    isCancelled.current = false;

    Animated.timing(progress, {
      toValue: 0.75,
      duration: 800,
      easing: SliderAnimation.easing,
      useNativeDriver: false,
    }).start();

    setAttemptedSummarizationModes((prev) => (prev.includes(mode) ? prev : [...prev, mode]));

    try {
      await runSummarizationOnly(mode);
    } catch (err: unknown) {
      const failure =
        err instanceof ProcessingFailure
          ? err
          : new ProcessingFailure(
              'summarization',
              toProcessingFailure(err, 'summarization', mode).message,
              mode,
            );
      registerSummarizationAttempt(failure.summarizationMode ?? mode);
      await failProcessing(failure, mode);
    }
  };

  const handleCancel = async () => {
    if (!recordingId) return;
    isCancelled.current = true;
    setIsRetrying(false);
    try {
      await updateRecording(recordingId, { status: 'saved', errorMessage: undefined });
    } catch {
      // Still leave the screen
    }
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
  const isBusy = stage !== 'error' && stage !== 'done';

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
        {backgroundNote && isBusy ? (
          <Text style={styles.backgroundNote}>{backgroundNote}</Text>
        ) : null}
        {stage !== 'error' ? (
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
          </View>
        ) : null}
        {isDebugMode && recording ? (
          <View style={styles.modeBadge}>
            <Ionicons name="mic-outline" size={12} color={Colors.primary} />
            <Text style={styles.modeBadgeText}>
              {transcriptionModeTitle(settingsTranscriptionMode)} ·{' '}
              {processingModeTitle(summarizationMode)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        {stage === 'error' && summarizationFallbackAction ? (
          <TouchableOpacity
            style={[styles.primaryButton, isRetrying && styles.primaryButtonDisabled]}
            onPress={handleSummarizationFallbackRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="sparkles" size={18} color={Colors.textPrimary} />
            )}
            <Text style={styles.primaryButtonText}>
              {isRetrying ? retryLabel : summarizationFallbackAction.buttonLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
        {stage === 'error' && showTranscriptionFallback ? (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              summarizationFallbackAction && styles.secondaryButton,
              isRetrying && styles.primaryButtonDisabled,
            ]}
            onPress={handleTranscriptionFallbackRetry}
            disabled={isRetrying}
          >
            {isRetrying && !summarizationFallbackAction ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="mic-outline" size={18} color={Colors.textPrimary} />
            )}
            <Text style={styles.primaryButtonText}>
              {isRetrying && !summarizationFallbackAction
                ? retryLabel ?? 'Transcribing recording…'
                : 'Transcribe from recording'}
            </Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={handleCancel} disabled={isRetrying}>
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
  backgroundNote: withAppFont({
    fontSize: 13,
    color: Colors.subtext,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm,
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
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  secondaryButton: {
    borderColor: Colors.border,
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
