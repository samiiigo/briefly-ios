import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import Constants from 'expo-constants';
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
import {
  normalizeTranscriptionMode,
  transcriptionModeBadge,
  transcriptionModeDescription,
} from '../utils/transcriptionMode';
import type { AssemblyAIConnectionState } from '../services/AssemblyAILiveTranscription';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Recording'>;

function generateSegmentId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const SENTENCE_BOUNDARY_REGEX = /[^.!?]+[.!?]+["')\]]*(?=\s|$)/g;

function appendChunk(base: string, chunk: string): string {
  const left = base.trim();
  const right = chunk.trim();
  if (!left) return right;
  if (!right) return left;
  return `${left} ${right}`;
}

function splitCompleteSentences(text: string): { sentences: string[]; remainder: string } {
  const source = text.trim();
  if (!source) {
    return { sentences: [], remainder: '' };
  }

  const sentences: string[] = [];
  let lastBoundary = 0;
  SENTENCE_BOUNDARY_REGEX.lastIndex = 0;

  let match = SENTENCE_BOUNDARY_REGEX.exec(source);
  while (match) {
    const sentence = match[0].trim();
    if (sentence) {
      sentences.push(sentence);
    }
    lastBoundary = match.index + match[0].length;
    match = SENTENCE_BOUNDARY_REGEX.exec(source);
  }

  return {
    sentences,
    remainder: source.slice(lastBoundary).trim(),
  };
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
    normalizeTranscriptionMode(route.params?.transcriptionModeOverride ?? defaultTranscriptionMode)
  );
  const [streamingState, setStreamingState] = useState<AssemblyAIConnectionState>('idle');

  // Live transcript display state
  const [finalText, setFinalText] = useState('');
  const [partialText, setPartialText] = useState('');

  const livePreviewScrollRef = useRef<ScrollView | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // For building preTranscript passed to SaveRecording
  const liveSegments = useRef<TranscriptSegment[]>([]);
  // Accumulated final text (so each onFinal delta can be computed)
  const prevFinalText = useRef('');
  const finalSentenceBufferRef = useRef('');
  const isStopped = useRef(false);
  const isPausedRef = useRef(false);

  // Buffered partial text to coalesce rapid onPartial events into ~80ms batches
  const pendingPartialRef = useRef('');
  const partialFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canCloudLive = AudioService.supportsLiveTranscription;
  const canOnDeviceLive = AudioService.supportsOnDeviceLiveTranscription;
  const selectedMode = normalizeTranscriptionMode(transcriptionMode);
  const isAssemblyAiLiveMode = selectedMode === 'live-assemblyai';
  const isLocalMode = selectedMode === 'local-on-device';
  const liveEngine: 'cloud' | 'on-device' | 'none' = isAssemblyAiLiveMode
    ? (canCloudLive ? 'cloud' : 'none')
    : isLocalMode
      ? (canOnDeviceLive ? 'on-device' : 'none')
      : 'none';
  const useLiveTranscription = liveEngine !== 'none';
  const effectiveTranscriptionMode: TranscriptionMode = useLiveTranscription
    ? selectedMode
    : 'post-assemblyai';

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
    finalSentenceBufferRef.current = '';

    (async () => {
      try {
        logger.info('FLOW', 'Recording screen session started', {
          useLiveTranscription,
          transcriptionMode,
        });
        if (useLiveTranscription) {
          const callbacks = {
            onPartial: (text: string) => {
              pendingPartialRef.current = text;
              if (!partialFlushTimerRef.current) {
                partialFlushTimerRef.current = setTimeout(() => {
                  partialFlushTimerRef.current = null;
                  if (isStopped.current) return;
                  const buffered = pendingPartialRef.current;
                  setPartialText(buffered);
                  const accFinal = liveSegments.current.map((s) => s.text).join(' ');
                  setLiveTranscript(accFinal ? `${accFinal} ${buffered}` : buffered);
                }, 80);
              }
            },
            onFinal: (text: string) => {
              if (partialFlushTimerRef.current) {
                clearTimeout(partialFlushTimerRef.current);
                partialFlushTimerRef.current = null;
              }
              pendingPartialRef.current = '';

              const prev = prevFinalText.current;
              const newWords = prev
                ? text.startsWith(prev)
                  ? text.slice(prev.length).trim()
                  : text
                : text;

              if (newWords) {
                const merged = appendChunk(finalSentenceBufferRef.current, newWords);
                const { sentences, remainder } = splitCompleteSentences(merged);

                if (sentences.length > 0) {
                  const endTime = elapsedRef.current;
                  let cursorStart = liveSegments.current.length > 0
                    ? liveSegments.current[liveSegments.current.length - 1].endTime
                    : 0;
                  liveSegments.current = [
                    ...liveSegments.current,
                    ...sentences.map((sentence) => {
                      const segment: TranscriptSegment = {
                        id: generateSegmentId(),
                        text: sentence,
                        startTime: cursorStart,
                        endTime,
                        isFinal: true,
                      };
                      cursorStart = endTime;
                      return segment;
                    }),
                  ];
                }

                finalSentenceBufferRef.current = remainder;
              }

              prevFinalText.current = text;

              const accumulated = liveSegments.current.map((s) => s.text).join(' ');
              setFinalText(accumulated);
              setPartialText(finalSentenceBufferRef.current);
              setLiveTranscript(
                finalSentenceBufferRef.current
                  ? appendChunk(accumulated, finalSentenceBufferRef.current)
                  : accumulated
              );
            },
            onConnectionState: (state: AssemblyAIConnectionState) => {
              setStreamingState(state);
            },
            onError: (message: string) => {
              setStreamingState('reconnecting');
              if (liveSegments.current.length === 0) {
                setLiveTranscript('Reconnecting live transcription...');
              }
              console.warn('[Transcription] live transcription error:', message);
            },
          };

          if (liveEngine === 'cloud') {
            // Native module handles recording + AssemblyAI real-time transcription together.
            await AudioService.startLiveTranscription(callbacks);
          } else {
            // Native module handles recording + on-device real-time transcription.
            await AudioService.startOnDeviceLiveTranscription(callbacks);
          }
        } else {
          // No native module: record audio only, transcription happens after stop
          await AudioService.startRecording();
        }

        setIsStarted(true);
        startTimer();
      } catch (err: any) {
        logger.error('FLOW', 'Failed to start recording session', {
          error: err?.message ?? String(err),
        });
        Alert.alert(
          'Microphone Error',
          err?.message ?? 'Could not start recording. Check microphone permissions.',
          [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
        );
      }
    })();

    return () => {
      stopTimer();
      if (partialFlushTimerRef.current) {
        clearTimeout(partialFlushTimerRef.current);
        partialFlushTimerRef.current = null;
      }
    };
    // Intentional: this flow runs exactly once when entering Recording screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Pause / Resume ───────────────────────────────────────────────────────

  const handlePause = async () => {
    try {
      if (isPaused) {
        if (useLiveTranscription) {
          if (liveEngine === 'cloud') {
            await AudioService.resumeLiveTranscription();
          } else {
            await AudioService.resumeOnDeviceLiveTranscription();
          }
        } else {
          await AudioService.resumeRecording();
        }
        startTimer();
        setIsPaused(false);
        isPausedRef.current = false;
        logger.info('FLOW', 'Recording resumed');
      } else {
        if (useLiveTranscription) {
          if (liveEngine === 'cloud') {
            await AudioService.pauseLiveTranscription();
          } else {
            await AudioService.pauseOnDeviceLiveTranscription();
          }
        } else {
          await AudioService.pauseRecording();
        }
        stopTimer();
        setIsPaused(true);
        isPausedRef.current = true;
        logger.info('FLOW', 'Recording paused');
      }
    } catch (err: any) {
      logger.error('FLOW', 'Failed to pause/resume recording', {
        error: err?.message ?? String(err),
      });
      Alert.alert('Error', err?.message ?? 'Could not pause or resume recording.');
    }
  };

  // ─── Stop ─────────────────────────────────────────────────────────────────

  const handleStop = async () => {
    logger.info('FLOW', 'Recording stop requested');
    isStopped.current = true;
    stopTimer();
    if (partialFlushTimerRef.current) {
      clearTimeout(partialFlushTimerRef.current);
      partialFlushTimerRef.current = null;
    }

    let result;
    if (useLiveTranscription) {
      try {
        result = liveEngine === 'cloud'
          ? await AudioService.stopLiveTranscription()
          : await AudioService.stopOnDeviceLiveTranscription();
      } catch (err: any) {
        logger.error('FLOW', 'Failed to stop live transcription recording', {
          error: err?.message ?? String(err),
        });
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

    const trimmedPartial = (pendingPartialRef.current || partialText).trim();
    const trailingText = appendChunk(finalSentenceBufferRef.current, trimmedPartial);
    if (trailingText) {
      liveSegments.current = [
        ...liveSegments.current,
        {
          id: generateSegmentId(),
          text: trailingText,
          startTime: liveSegments.current.length > 0
            ? liveSegments.current[liveSegments.current.length - 1].endTime
            : 0,
          endTime: elapsedRef.current,
          isFinal: true,
        },
      ];
      setPartialText('');
      finalSentenceBufferRef.current = '';
    }

    const preTranscript = liveSegments.current.length > 0 ? liveSegments.current : undefined;

    if ((isAssemblyAiLiveMode && !canCloudLive) || (isLocalMode && !canOnDeviceLive)) {
      Alert.alert(
        'Live transcription unavailable in this build',
        'This run cannot stream live transcription because the native BrieflyTranscriber module is unavailable. The app will keep your selected mode, but this recording will be transcribed after stop. To enable streaming, run a native dev build (npx expo run:ios or npx expo run:android) and launch with --dev-client.'
      );
    }

    navigation.replace('SaveRecording', {
      duration: result?.duration || elapsed,
      filePath: result?.uri ?? '',
      fileSize: result?.fileSize ?? 0,
      preTranscript,
      transcriptionMode: effectiveTranscriptionMode,
      targetFolder: route.params?.targetFolder,
      targetUserFolderId: route.params?.targetUserFolderId,
    });
    logger.info('FLOW', 'Navigated to save recording screen', {
      durationSec: result?.duration || elapsed,
      hasPreTranscript: !!preTranscript,
      transcriptionMode,
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
          logger.warn('FLOW', 'Recording discarded by user');
          isStopped.current = true;
          stopTimer();
          if (partialFlushTimerRef.current) {
            clearTimeout(partialFlushTimerRef.current);
            partialFlushTimerRef.current = null;
          }
          if (useLiveTranscription) {
            if (liveEngine === 'cloud') {
              await AudioService.stopLiveTranscription().catch(() => {});
            } else {
              await AudioService.stopOnDeviceLiveTranscription().catch(() => {});
            }
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

  const hasAnyText = finalText.length > 0 || partialText.length > 0;

  const liveUnavailableMessage = (() => {
    const modeLabel = isAssemblyAiLiveMode ? 'Live (AssemblyAI)' : 'Local (on-device)';
    const capabilityLabel = isAssemblyAiLiveMode
      ? 'AssemblyAI live streaming with BrieflyTranscriber'
      : 'native on-device speech recognition with BrieflyTranscriber';
    const fallbackLine = 'This recording will fall back to post-recording AssemblyAI transcription after you stop.';
    if (Constants.appOwnership === 'expo') {
      return `${modeLabel} requires ${capabilityLabel}. This run is in Expo Go, which does not include the native transcription module. Next steps: run npx expo run:ios or npx expo run:android and retry. ${fallbackLine}`;
    }
    return `${modeLabel} requires ${capabilityLabel} on ${Platform.OS}. This build is missing that capability. Next steps: enable the native transcription module and rebuild the app. ${fallbackLine}`;
  })();

  const livePreviewPlaceholder = useLiveTranscription
    ? isAssemblyAiLiveMode
      ? 'Listening with AssemblyAI... your words will appear live.'
      : 'Listening on-device... your words will appear live.'
    : isAssemblyAiLiveMode || isLocalMode
      ? liveUnavailableMessage
      : 'Transcription will be generated after you stop recording.';
  const showLivePreview = selectedMode !== 'post-assemblyai';

  const handleChooseTranscriptionMode = () => {
    Alert.alert(
      'Transcription for this recording',
      transcriptionModeDescription(selectedMode),
      [
        { text: 'Live (AssemblyAI)', onPress: () => setTranscriptionMode('live-assemblyai') },
        { text: 'Post-recording (AssemblyAI)', onPress: () => setTranscriptionMode('post-assemblyai') },
        { text: 'Local (on-device)', onPress: () => setTranscriptionMode('local-on-device') },
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

      {showLivePreview && (
        <View style={styles.livePreviewContainer}>
          <View style={styles.livePreviewHeader}>
            <Ionicons name="document-text" size={14} color={Colors.primary} />
            <Text style={styles.livePreviewLabel}>Live Preview</Text>
            {useLiveTranscription && (
              <Text style={styles.streamingStatusText}>
                {streamingState === 'reconnecting'
                  ? 'Reconnecting...'
                  : streamingState === 'open'
                    ? 'Live'
                    : streamingState === 'connecting'
                      ? 'Connecting...'
                      : ''}
              </Text>
            )}
            <View style={styles.onDevicePill}>
              <Text style={styles.onDevicePillText}>{transcriptionModeBadge(selectedMode)}</Text>
            </View>
          </View>
          <ScrollView
            ref={livePreviewScrollRef}
            style={styles.livePreviewScroll}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              livePreviewScrollRef.current?.scrollToEnd({ animated: true });
            }}
          >
            {hasAnyText ? (
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
      )}

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
  streamingStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.orange,
    marginRight: 6,
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
