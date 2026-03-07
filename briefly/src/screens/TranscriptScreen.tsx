import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Share,
  GestureResponderEvent,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRecordingStore } from '../store/useRecordingStore';
import { AudioService } from '../services/AudioService';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { KeyInsights } from '../components/KeyInsights';
import { TranscriptSegmentView } from '../components/TranscriptSegmentView';
import { ProcessingBadge } from '../components/ProcessingBadge';
import { RootStackParamList } from '../types';
import { formatDuration, formatDate, ensureUniqueTitle } from '../utils';
import { Colors, Spacing, BorderRadius } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Transcript'>;

export function TranscriptScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { recordingId } = route.params;
  const recording = useRecordingStore((s) => s.getRecordingById(recordingId));
  const { updateRecording, recordings } = useRecordingStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPos, setPlaybackPos] = useState(0);
  const [playbackDur, setPlaybackDur] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
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

  const handleRename = useCallback(() => {
    if (!recording) return;
    const existingTitles = recordings.filter((r) => r.id !== recording.id).map((r) => r.title);
    const save = (text: string) => {
      const t = text.trim();
      if (t) updateRecording(recording.id, { title: ensureUniqueTitle(t, existingTitles) });
    };
    if (Platform.OS === 'ios') {
      Alert.prompt('Rename Recording', undefined, save, 'plain-text', recording.title);
    } else {
      Alert.alert('Rename', 'Long-press the recording card on the home screen to rename it.');
    }
  }, [recording, recordings, updateRecording]);

  const handleRetry = useCallback(async () => {
    if (!recording) return;
    await updateRecording(recording.id, {
      status: 'transcribing',
      errorMessage: undefined,
      transcript: undefined,
      summary: undefined,
      keyInsights: undefined,
    });
    navigation.replace('Summarizing', { recordingId: recording.id });
  }, [recording, updateRecording, navigation]);

  const escapeHtml = (text: string) =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const buildPdfHtml = useCallback(() => {
    if (!recording) return '';
    const summary = recording.summary ?? 'No summary available.';
    const insights = recording.keyInsights ?? [];
    const transcript = recording.transcript ?? [];

    const insightItems = insights.length
      ? insights.map((item) => `<li>${escapeHtml(item.text)}</li>`).join('')
      : '<li>No key points detected.</li>';

    const transcriptItems = transcript.length
      ? transcript
          .map(
            (segment) => `
        <div class="segment">
          <div class="segment-time">${escapeHtml(formatDuration(segment.startTime))} - ${escapeHtml(formatDuration(segment.endTime))}</div>
          <div class="segment-text">${escapeHtml(segment.text)}</div>
        </div>
      `
          )
          .join('')
      : '<p class="muted">No transcript available.</p>';

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 32px; color: #111; }
            .title { font-size: 26px; font-weight: 700; margin-bottom: 6px; }
            .meta { font-size: 12px; color: #666; margin-bottom: 24px; }
            .section-title { font-size: 14px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; margin-top: 22px; margin-bottom: 10px; color: #222; }
            .summary { background: #f5f7fb; border: 1px solid #e6ebf5; border-radius: 10px; padding: 14px; font-size: 14px; line-height: 1.6; }
            ul { margin-top: 0; padding-left: 18px; }
            li { margin-bottom: 8px; font-size: 14px; line-height: 1.5; }
            .segment { border-bottom: 1px solid #ececec; padding: 10px 0; }
            .segment-time { font-size: 12px; color: #666; margin-bottom: 4px; }
            .segment-text { font-size: 14px; line-height: 1.6; }
            .muted { color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="title">${escapeHtml(recording.title)}</div>
          <div class="meta">Created ${escapeHtml(formatDate(recording.createdAt))} · Duration ${escapeHtml(formatDuration(recording.duration))}</div>

          <div class="section-title">Summary</div>
          <div class="summary">${escapeHtml(summary)}</div>

          <div class="section-title">Key Points / Action Items</div>
          <ul>${insightItems}</ul>

          <div class="section-title">Transcript</div>
          ${transcriptItems}
        </body>
      </html>
    `;
  }, [recording]);

  const handleExportPdf = useCallback(async () => {
    if (!recording) return;
    try {
      setIsExportingPdf(true);
      const html = buildPdfHtml();
      const { uri } = await Print.printToFileAsync({ html, base64: false });

      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export note as PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF Ready', `PDF exported to:\n${uri}`);
      }
    } catch (error: any) {
      Alert.alert('Export failed', error?.message ?? 'Could not export this note as PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  }, [buildPdfHtml, recording]);

  const handleShareText = useCallback(async () => {
    if (!recording) return;
    const summary = recording.summary?.trim() || 'No summary available.';
    const insights = (recording.keyInsights ?? []).map((k) => `• ${k.text}`).join('\n');
    const transcript = (recording.transcript ?? []).map((s) => s.text).join(' ').trim();

    const message =
      `${recording.title}\n` +
      `${formatDate(recording.createdAt)}\n\n` +
      `Summary:\n${summary}\n\n` +
      `Key Points / Action Items:\n${insights || 'None'}\n\n` +
      `Transcript:\n${transcript || 'No transcript available.'}`;

    try {
      await Share.share({ message, title: recording.title });
    } catch {}
  }, [recording]);

  const openShareMenu = useCallback(() => {
    if (isExportingPdf) return;
    Alert.alert('Share Note', 'Choose what to share.', [
      { text: 'Share as Text', onPress: handleShareText },
      { text: 'Export to PDF', onPress: handleExportPdf },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [handleExportPdf, handleShareText, isExportingPdf]);

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
        <TouchableOpacity onPress={handleRename} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="pencil-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
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

        {/* Error banner */}
        {recording.status === 'error' && (
          <View style={styles.errorBanner}>
            <View style={styles.errorBannerTop}>
              <Ionicons name="warning" size={16} color={Colors.orange} />
              <Text style={styles.errorBannerTitle}>Processing failed</Text>
            </View>
            {!!recording.errorMessage && (
              <Text style={styles.errorBannerMessage} numberOfLines={3}>
                {recording.errorMessage}
              </Text>
            )}
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Ionicons name="refresh" size={15} color={Colors.textPrimary} />
              <Text style={styles.retryButtonText}>Retry Transcription & Summary</Text>
            </TouchableOpacity>
          </View>
        )}

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

          <TouchableOpacity onPress={openShareMenu}>
            <Ionicons
              name={isExportingPdf ? 'hourglass-outline' : 'share-outline'}
              size={24}
              color={Colors.textPrimary}
            />
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

  // Error / retry
  errorBanner: {
    backgroundColor: 'rgba(255, 159, 10, 0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 159, 10, 0.35)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  errorBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.orange,
  },
  errorBannerMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    marginTop: 4,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
