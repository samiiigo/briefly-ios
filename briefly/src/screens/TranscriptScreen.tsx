import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  GestureResponderEvent,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useRecordingStore } from '../store/useRecordingStore';
import { AudioService } from '../services/AudioService';
import { KeyInsights } from '../components/KeyInsights';
import { TranscriptSegmentView } from '../components/TranscriptSegmentView';
import { ProcessingBadge } from '../components/ProcessingBadge';
import { RootStackParamList, TranscriptSegment } from '../types';
import { formatDuration, formatDate } from '../utils';
import { Colors, Spacing, BorderRadius } from '../utils/theme';

type Route = RouteProp<RootStackParamList, 'Transcript'>;

export function TranscriptScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { recordingId } = route.params;
  const recording = useRecordingStore((s) => s.getRecordingById(recordingId));

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPos, setPlaybackPos] = useState(0);
  const [playbackDur, setPlaybackDur] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const trackWidth = useRef(0);

  const cycleRate = useCallback(async () => {
    const rates = [1.0, 1.5, 2.0];
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(next);
    await AudioService.setPlaybackSpeed(next);
  }, [playbackRate]);

  const handlePlayPause = useCallback(async () => {
    if (!recording) return;
    if (isPlaying) {
      await AudioService.pausePlayback();
      setIsPlaying(false);
    } else {
      if (playbackPos === 0 || playbackPos >= playbackDur - 0.5) {
        await AudioService.playRecording(
          recording.filePath,
          (pos, dur, playing) => {
            setPlaybackPos(pos);
            setPlaybackDur(dur);
            setIsPlaying(playing);
            // Highlight active segment
            if (recording.transcript) {
              const active = recording.transcript.find(
                (s) => pos >= s.startTime && pos < s.endTime
              );
              setActiveSegmentId(active?.id ?? null);
            }
          }
        );
      } else {
        await AudioService.resumePlayback();
      }
      setIsPlaying(true);
    }
  }, [isPlaying, playbackPos, playbackDur, recording]);

  const handleSeek = useCallback(
    async (direction: 'back' | 'forward') => {
      const delta = direction === 'back' ? -15 : 15;
      const newPos = Math.max(0, Math.min(playbackDur, playbackPos + delta));
      await AudioService.seekTo(newPos);
      setPlaybackPos(newPos);
    },
    [playbackPos, playbackDur]
  );

  const handleProgressTap = useCallback(
    async (e: GestureResponderEvent) => {
      if (!playbackDur || trackWidth.current === 0) return;
      const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / trackWidth.current));
      const newPos = ratio * playbackDur;
      await AudioService.seekTo(newPos);
      setPlaybackPos(newPos);
    },
    [playbackDur]
  );

  if (!recording) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: Colors.textPrimary, padding: 20 }}>Recording not found.</Text>
      </SafeAreaView>
    );
  }

  const progress = playbackDur > 0 ? playbackPos / playbackDur : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerDate}>{formatDate(recording.createdAt)}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{recording.title}</Text>
        <View style={styles.metaRow}>
          <ProcessingBadge mode={recording.processingMode} size="sm" />
        </View>

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
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          <View style={[styles.progressThumb, { left: `${progress * 100}%` }]} />
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

          <TouchableOpacity>
            <Ionicons name="share-outline" size={24} color={Colors.textPrimary} />
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
    gap: Spacing.sm,
    marginBottom: Spacing.md,
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
});
