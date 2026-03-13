import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRecordingStore } from '../store/useRecordingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { TranscriptionService } from '../services/TranscriptionService';
import { SummarizationService } from '../services/SummarizationService';
import { RootStackParamList } from '../types';
import { transcriptionModeTitle } from '../utils/transcriptionMode';
import { Colors, Spacing, BorderRadius, SliderAnimation } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Summarizing'>;

type Stage = 'transcribing' | 'summarizing' | 'done' | 'error';

export function SummarizingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { recordingId } = route.params;

  const { getRecordingById, updateRecording } = useRecordingStore();
  const { defaultTranscriptionMode } = useSettingsStore();
  const recording = getRecordingById(recordingId);

  const [stage, setStage] = useState<Stage>('transcribing');
  const [progress] = useState(new Animated.Value(0));
  const [errorMessage, setErrorMessage] = useState('');
  const isCancelled = useRef(false);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;

    const rec = getRecordingById(recordingId);
    if (!rec) return;
    hasStarted.current = true;

    const transcriptionMode = rec.transcriptionMode ?? defaultTranscriptionMode;
    const processingMode = rec.processingMode;
    const filePath = rec.filePath;
    const preTranscript = rec.transcript;

    Animated.timing(progress, {
      toValue: 0.4,
      duration: 1500,
      easing: SliderAnimation.easing,
      useNativeDriver: false,
    }).start();

    (async () => {
      try {
        setStage('transcribing');
        const hasLiveTranscript = !!(preTranscript && preTranscript.length > 0);
        let segments = preTranscript ?? [];

        if (!hasLiveTranscript) {
          const lastChunkSegments = await TranscriptionService.transcribe(
            filePath,
            undefined,
            transcriptionMode
          );
          if (isCancelled.current) return;
          segments = lastChunkSegments;
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

        const { summary, keyInsights } = await SummarizationService.summarize(
          segments,
          processingMode
        );

        if (isCancelled.current) return;

        Animated.timing(progress, {
          toValue: 1,
          duration: 500,
          easing: SliderAnimation.easing,
          useNativeDriver: false,
        }).start();

        await updateRecording(recordingId, {
          status: 'ready',
          summary,
          keyInsights,
        });

        setStage('done');
        setTimeout(() => {
          if (!isCancelled.current) {
            navigation.replace('Transcript', { recordingId });
          }
        }, 600);
      } catch (err: any) {
        if (isCancelled.current) return;
        setErrorMessage(err.message ?? 'Unknown error');
        setStage('error');
        await updateRecording(recordingId, {
          status: 'error',
          errorMessage: err.message,
        });
      }
    })();

    return () => {
      isCancelled.current = true;
    };
    // recordingId is the only true dependency — the effect captures everything
    // else at invocation time via getRecordingById / store snapshots. Including
    // `recording` would cause cleanup→isCancelled on every store update, which
    // is the root cause of the bug this fixes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingId]);

  const handleRunLocally = async () => {
    if (!recording) return;
    await updateRecording(recordingId, { processingMode: 'on-device', status: 'transcribing' });
    navigation.replace('Summarizing', { recordingId });
  };

  const handleRetry = async () => {
    if (!recording) return;
    await updateRecording(recordingId, { status: 'transcribing', errorMessage: undefined });
    hasStarted.current = false;
    isCancelled.current = false;
    setStage('transcribing');
    setErrorMessage('');
    progress.setValue(0);
    navigation.replace('Summarizing', { recordingId });
  };

  const handleCancel = () => {
    isCancelled.current = true;
    navigation.navigate('Main');
  };

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const stageLabel = {
    transcribing: 'Transcribing your audio...',
    summarizing: 'Analyzing key decisions and action items.',
    done: 'Done!',
    error: errorMessage || 'Something went wrong.',
  }[stage];

  const stageTitle = {
    transcribing: 'Transcribing...',
    summarizing: 'Generating your summary...',
    done: 'Complete!',
    error: 'Processing failed',
  }[stage];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {stage === 'transcribing' ? 'Transcribing' : 'Summarizing'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          {stage === 'error' ? (
            <Ionicons name="warning" size={48} color={Colors.orange} />
          ) : stage === 'done' ? (
            <Ionicons name="checkmark-circle" size={48} color={Colors.green} />
          ) : (
            <Ionicons name="sparkles" size={48} color={Colors.textPrimary} />
          )}
        </View>

        <Text style={styles.title}>{stageTitle}</Text>
        <Text style={styles.subtitle}>{stageLabel}</Text>

        {stage !== 'error' && (
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
          </View>
        )}

        {recording && (
          <View style={styles.modeBadge}>
            <Ionicons name="lock-closed" size={12} color={Colors.green} />
            <Text style={styles.modeBadgeText}>
              {`TRANSCRIPTION: ${transcriptionModeTitle(
                recording.transcriptionMode ?? defaultTranscriptionMode
              ).toUpperCase()}`}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {stage === 'error' && (
          <TouchableOpacity style={styles.primaryButton} onPress={handleRetry}>
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
        {recording?.processingMode !== 'on-device' && stage !== 'error' && (
          <TouchableOpacity style={styles.secondaryButton} onPress={handleRunLocally}>
            <Ionicons name="hardware-chip-outline" size={18} color={Colors.textPrimary} />
            <Text style={styles.secondaryButtonText}>Run Locally Instead</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,122,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.surface,
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
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.green,
    letterSpacing: 0.5,
  },
  actions: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: 16,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    width: '100%',
  },
  primaryButtonText: { fontSize: 17, fontWeight: '600', color: '#fff' },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: 16,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    width: '100%',
  },
  secondaryButtonText: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  cancelText: { fontSize: 17, color: Colors.textSecondary },
});
