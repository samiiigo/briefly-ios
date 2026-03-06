import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AudioService } from '../services/AudioService';
import { WaveformVisualizer } from '../components/WaveformVisualizer';
import { Colors, Spacing, BorderRadius } from '../utils/theme';
import { formatDuration } from '../utils';
import { RootStackParamList } from '../types';
import { useRecordingStore } from '../store/useRecordingStore';
import { useSettingsStore } from '../store/useSettingsStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function RecordingScreen() {
  const navigation = useNavigation<Nav>();
  const { liveTranscript, setLiveTranscript } = useRecordingStore();
  const { defaultProcessingMode } = useSettingsStore();

  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [title, setTitle] = useState('New Recording');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLiveTranscript('');
      await AudioService.startRecording();
      setIsStarted(true);
      startTimer();
    })();

    return () => {
      stopTimer();
    };
  }, []);

  const handlePause = async () => {
    if (isPaused) {
      await AudioService.resumeRecording();
      startTimer();
      setIsPaused(false);
    } else {
      await AudioService.pauseRecording();
      stopTimer();
      setIsPaused(true);
    }
  };

  const handleStop = async () => {
    stopTimer();
    const result = await AudioService.stopRecording();
    navigation.replace('SaveRecording', {
      duration: result.duration || elapsed,
      filePath: result.uri,
      fileSize: result.fileSize,
    });
  };

  const handleDiscard = async () => {
    stopTimer();
    await AudioService.stopRecording().catch(() => {});
    setLiveTranscript('');
    navigation.goBack();
  };

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDiscard} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.recordingIndicator}>
            <View style={[styles.dot, isPaused && styles.dotPaused]} />
            <Text style={[styles.recordingText, isPaused && styles.pausedText]}>
              {isPaused ? 'Paused' : 'Recording'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerButton}>
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
        </View>
        <ScrollView style={styles.livePreviewScroll} showsVerticalScrollIndicator={false}>
          {liveTranscript ? (
            <Text style={styles.liveTranscriptText}>{liveTranscript}</Text>
          ) : (
            <Text style={styles.liveTranscriptPlaceholder}>
              Transcript will appear here as you speak...
            </Text>
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
  },
  livePreviewScroll: {
    flex: 1,
  },
  liveTranscriptText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
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
