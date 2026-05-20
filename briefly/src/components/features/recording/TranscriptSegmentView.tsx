import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TranscriptSegment } from '@/types';
import { formatTimestamp } from '@/utils';
import { Colors, Spacing, BorderRadius, withAppFont } from '@/theme';

interface Props {
  segment: TranscriptSegment;
  isActive?: boolean;
}

const SPEAKER_COLORS = [Colors.primary, '#34C759', '#FF9500', '#AF52DE', '#FF2D55'];

function speakerColor(speaker?: string): string {
  if (!speaker) return Colors.primary;
  let hash = 0;
  for (let i = 0; i < speaker.length; i++) {
    hash = speaker.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SPEAKER_COLORS[Math.abs(hash) % SPEAKER_COLORS.length];
}

export function TranscriptSegmentView({ segment, isActive }: Props) {
  const color = speakerColor(segment.speaker);

  return (
    <View style={[styles.container, isActive && styles.active]}>
      {segment.speakerInitial ? (
        <View style={styles.avatarColumn}>
          <View style={[styles.avatar, { backgroundColor: color + '33' }]}>
            <Text style={[styles.avatarText, { color }]}>{segment.speakerInitial}</Text>
          </View>
        </View>
      ) : null}

      <Text style={styles.timestamp}>{formatTimestamp(segment.startTime)}</Text>

      <View style={styles.content}>
        {segment.speaker ? (
          <Text style={[styles.speaker, { color }]}>{segment.speaker}</Text>
        ) : null}
        <Text style={styles.text}>{segment.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    marginBottom: 2,
  },
  active: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardXL,
  },
  avatarColumn: {
    width: 32,
    flexShrink: 0,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: withAppFont({
    fontSize: 14,
    fontWeight: '700',
  }),
  timestamp: withAppFont({
    width: 38,
    flexShrink: 0,
    fontSize: 12,
    color: Colors.textTertiary,
    paddingTop: 3,
    fontVariant: ['tabular-nums'],
  }),
  content: {
    flex: 1,
    minWidth: 0,
  },
  speaker: withAppFont({
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  }),
  text: withAppFont({
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  }),
});
