import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TranscriptSegment } from '../types';
import { formatTimestamp } from '../utils';
import { Colors, Spacing, BorderRadius } from '../utils/theme';

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
      <View style={styles.left}>
        {segment.speakerInitial ? (
          <View style={[styles.avatar, { backgroundColor: color + '33' }]}>
            <Text style={[styles.avatarText, { color }]}>{segment.speakerInitial}</Text>
          </View>
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.meta}>
          {segment.speaker && (
            <Text style={[styles.speaker, { color }]}>{segment.speaker}</Text>
          )}
          <Text style={styles.timestamp}>{formatTimestamp(segment.startTime)}</Text>
        </View>
        <Text style={styles.text}>{segment.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: 2,
  },
  active: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  left: {
    width: 36,
    marginRight: Spacing.sm,
    alignItems: 'center',
    paddingTop: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  speaker: {
    fontSize: 13,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  text: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
});
