import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TranscriptSegment } from '@/types';
import { formatTimestamp } from '@/utils';
import { useCreateStyles, useThemedColors, Spacing, BorderRadius, withAppFont } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';
interface Props {
  segment: TranscriptSegment;
  isActive?: boolean;
}
const SPEAKER_ACCENT = ['#34C759', '#FF9500', '#AF52DE', '#FF2D55'] as const;
function speakerColor(primary: string, speaker?: string): string {
  if (!speaker) return primary;
  let hash = 0;
  for (let i = 0; i < speaker.length; i++) {
    hash = speaker.charCodeAt(i) + ((hash << 5) - hash);
  }
  const accents = [primary, ...SPEAKER_ACCENT];
  return accents[Math.abs(hash) % accents.length];
}
export function TranscriptSegmentView({ segment, isActive }: Props) {
  const styles = useCreateStyles(createTranscriptSegmentStyles);
  const colors = useThemedColors();
  const color = useMemo(
    () => speakerColor(colors.primary, segment.speaker),
    [colors.primary, segment.speaker],
  );
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
function createTranscriptSegmentStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
      paddingVertical: Spacing.sm,
      marginBottom: 2,
    },
    active: {
      backgroundColor: c.card,
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
      color: c.textTertiary,
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
      color: c.textPrimary,
      lineHeight: 22,
    }),
  });
}
