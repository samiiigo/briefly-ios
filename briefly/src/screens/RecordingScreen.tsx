import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AudioService } from '../services/AudioService';
import { WaveformVisualizer } from '../components/WaveformVisualizer';
import { Colors, Spacing, BorderRadius } from '../utils/theme';
import { RootStackParamList, TranscriptSegment, TranscriptionMode } from '../types';
import { useRecordingStore } from '../store/useRecordingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { transcriptionModeBadge, transcriptionModeDescription } from '../utils/transcriptionMode';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Recording'>;

function generateSegmentId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function RecordingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { setLiveTranscript } = useRecordingStore();
  const { defaultTranscriptionMode } = useSettingsStore();

  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [transcriptionMode, setTranscriptionMode] = useState<TranscriptionMode>(
    route.params?.transcriptionModeOverride ?? defaultTranscriptionMode
  );

  // Live transcript display state
  const [finalText, setFinalText] = useState('');
  const [partialText, setPartialText] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // For building preTranscript passed to SaveRecording
  const liveSegments = useRef<TranscriptSegment[]>([]);
  // Accumulated final text (so each onFinal delta can be computed)
  const prevFinalText = useRef('');
  const isStopped = useRef(false);
  const isPausedRef = useRef(false);

  const useLiveTranscription = AudioService.supportsLiveTranscription;

  // ─── Timer ────────────────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setElapsed((e) => {
        elapsedRef.current = e + 1;
        return e + 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ─── Mount: start recording ───────────────────────────────────────────────

  useEffect(() => {
    setLiveTranscript('');
    setFinalText('');
    setPartialText('');
    liveSegments.current = [];
    prevFinalText.current = '';

    (async () => {
      try {
        if (useLiveTranscription) {
          // iOS: AVAudioEngine handles recording + real-time transcription together
          await AudioService.startLiveTranscription({
            onPartial: (text) => {
              setPartialText(text);
              setLiveTranscript(
                prevFinalText.current
                  ? prevFinalText.current + ' ' + text
                  : text
              );
            },
            onFinal: (text) => {
              // SFSpeechRecognizer returns the full text for the current task segment.
              // Compute the delta vs. the last known final to get just the new words.
              const prev = prevFinalText.current;
              const newWords = prev
                ? text.startsWith(prev)
                  ? text.slice(prev.length).trim()
                  : text
                : text;

              if (newWords) {
                const seg: TranscriptSegment = {
                  id: generateSegmentId(),
                  text: newWords,
                  startTime: liveSegments.current.length > 0
                    ? liveSegments.current[liveSegments.current.length - 1].endTime
                    : 0,
                  endTime: 0, // updated below
                  isFinal: true,
                };
                // Approximate endTime from elapsed timer (use ref to avoid stale closure)
                seg.endTime = elapsedRef.current;
                liveSegments.current = [...liveSegments.current, seg];
              }

              // After each final, SFSpeechRecognizer starts fresh for the next segment,
              // so reset prevFinalText to '' for the new task window.
              prevFinalText.current = '';

              const accumulated = liveSegments.current.map((s) => s.text).join(' ');
              setFinalText(accumulated);
              setPartialText('');
              setLiveTranscript(accumulated);
            },
          });
        } else {
          // No native module: record audio only, transcription happens after stop
          await AudioService.startRecording();
        }

        setIsStarted(true);
        startTimer();
      } catch (err: any) {
        Alert.alert(
          'Microphone Error',
          err?.message ?? 'Could not start recording. Check microphone permissions.',
          [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
        );
      }
    })();

    return () => {
      stopTimer();
    };
    // Intentional: this flow runs exactly once when entering Recording screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Pause / Resume ───────────────────────────────────────────────────────

  const handlePause = async () => {
    try {
      if (isPaused) {
        if (useLiveTranscription) {
          await AudioService.resumeLiveTranscription();
        } else {
          await AudioService.resumeRecording();
        }
        startTimer();
        setIsPaused(false);
        isPausedRef.current = false;
      } else {
        if (useLiveTranscription) {
          await AudioService.pauseLiveTranscription();
        } else {
          await AudioService.pauseRecording();
        }
        stopTimer();
        setIsPaused(true);
        isPausedRef.current = true;
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not pause or resume recording.');
    }
  };

  // ─── Stop ─────────────────────────────────────────────────────────────────

  const handleStop = async () => {
    isStopped.current = true;
    stopTimer();

    let result;
    if (useLiveTranscription) {
      try {
        result = await AudioService.stopLiveTranscription();
      } catch (err: any) {
        Alert.alert('Error', err?.message ?? 'Could not stop recording.');
        return;
      }
    } else {
      try {
        result = await AudioService.stopRecording();
      } catch {
        await new Promise((r) => setTimeout(r, 300));
        try {
          result = await AudioService.stopRecording();
        } catch {}
      }
    }

    const preTranscript = liveSegments.current.length > 0 ? liveSegments.current : undefined;

    navigation.replace('SaveRecording', {
      duration: result?.duration || elapsed,
      filePath: result?.uri ?? '',
      fileSize: result?.fileSize ?? 0,
      preTranscript,
      transcriptionMode,
      targetFolder: route.params?.targetFolder,
      targetUserFolderId: route.params?.targetUserFolderId,
    });
  };

  // ─── Discard ──────────────────────────────────────────────────────────────

  const handleDiscard = () => {
    Alert.alert('Discard Recording', 'This recording will be deleted.', [
      { text: 'Keep Recording', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          isStopped.current = true;
          stopTimer();
          if (useLiveTranscription) {
            await AudioService.stopLiveTranscription().catch(() => {});
          } else {
            await AudioService.stopRecording().catch(() => {});
          }
          setLiveTranscript('');
          navigation.navigate('Main');
        },
      },
    ]);
  };

  // ─── Derived display values ────────────────────────────────────────────────

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const showLiveText = finalText || partialText;

  const livePreviewPlaceholder = useLiveTranscription
    ? 'Listening… speak naturally and your words will appear here instantly.'
    : transcriptionMode === 'cloud'
      ? 'Transcription will run in the cloud after you stop recording.'
      : 'Transcription will run on-device after you stop recording.';

  const handleChooseTranscriptionMode = () => {
    Alert.alert(
      'Transcription for this recording',
      transcriptionModeDescription(transcriptionMode),
      [
        { text: 'On-device', onPress: () => setTranscriptionMode('on-device') },
        { text: 'Cloud', onPress: () => setTranscriptionMode('cloud') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDiscard} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>New Recording</Text>
          <View style={styles.recordingIndicator}>
            <View style={[styles.dot, isPaused && styles.dotPaused]} />
            <Text style={[styles.recordingText, isPaused && styles.pausedText]}>
              {isPaused ? 'Paused' : 'Recording'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={handleChooseTranscriptionMode}>
          <Ionicons name="ellipsis-vertical" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Timer */}
      <View style={styles.timerContainer}>
        <View style={styles.timerCard}>
          <View style={styles.timerBlock}>
            <Text style={styles.timerDigit}>{String(hours).padStart(2, '0')}</Text>
            <Text style={styles.timerLabel}>HRS</Text>
          </View>
          <Text style={styles.timerSep}>:</Text>
          <View style={styles.timerBlock}>
            <Text style={styles.timerDigit}>{String(minutes).padStart(2, '0')}</Text>
            <Text style={styles.timerLabel}>MIN</Text>
          </View>
          <Text style={styles.timerSep}>:</Text>
          <View style={styles.timerBlock}>
            <Text style={styles.timerDigit}>{String(seconds).padStart(2, '0')}</Text>
            <Text style={styles.timerLabel}>SEC</Text>
          </View>
        </View>
      </View>

      {/* Waveform */}
      <View style={styles.waveformContainer}>
        <WaveformVisualizer isActive={isStarted && !isPaused} barCount={24} />
      </View>

      {/* Live Preview */}
      <View style={styles.livePreviewContainer}>
        <View style={styles.livePreviewHeader}>
          <Ionicons name="document-text" size={14} color={Colors.primary} />
          <Text style={styles.livePreviewLabel}>Live Preview</Text>
          <View style={styles.onDevicePill}>
            <Text style={styles.onDevicePillText}>{transcriptionModeBadge(transcriptionMode)}</Text>
          </View>
        </View>
        <ScrollView style={styles.livePreviewScroll} showsVerticalScrollIndicator={false}>
          {showLiveText ? (
            <Text style={styles.liveTranscriptText}>
              {finalText}
              {finalText && partialText ? ' ' : ''}
              {partialText ? (
                <Text style={styles.partialText}>{partialText}</Text>
              ) : null}
            </Text>
          ) : (
            <Text style={styles.liveTranscriptPlaceholder}>{livePreviewPlaceholder}</Text>
          )}
        </ScrollView>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.controlItem}>
          <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
            <Ionicons
              name={isPaused ? 'play' : 'pause'}
              size={26}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.controlLabel}>{isPaused ? 'RESUME' : 'PAUSE'}</Text>
        </View>

        <View style={styles.controlItem}>
          <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
            <View style={styles.stopSquare} />
          </TouchableOpacity>
          <Text style={[styles.controlLabel, { color: Colors.recordButton }]}>STOP</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.green,
  },
  dotPaused: {
    backgroundColor: Colors.orange,
  },
  recordingText: {
    fontSize: 12,
    color: Colors.green,
    fontWeight: '500',
  },
  pausedText: {
    color: Colors.orange,
  },

  // Timer
  timerContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  timerBlock: {
    alignItems: 'center',
    minWidth: 60,
  },
  timerDigit: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginTop: 2,
  },
  timerSep: {
    fontSize: 40,
    fontWeight: '300',
    color: Colors.textSecondary,
    paddingBottom: 8,
    marginHorizontal: 4,
  },

  // Waveform
  waveformContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },

  // Live preview
  livePreviewContainer: {
    flex: 1,
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  livePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  livePreviewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    flex: 1,
  },
  onDevicePill: {
    backgroundColor: 'rgba(52,199,89,0.15)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  onDevicePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.green,
    letterSpacing: 0.5,
  },
  livePreviewScroll: {
    flex: 1,
  },
  liveTranscriptText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  partialText: {
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  liveTranscriptPlaceholder: {
    fontSize: 15,
    color: Colors.textTertiary,
    lineHeight: 22,
    fontStyle: 'italic',
  },

  // Controls
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xxl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  controlItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  pauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.recordButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopSquare: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  controlLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
});
