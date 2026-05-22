import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recording } from '@/types';
import { formatDuration, formatDate } from '@/utils';
import { resolveRecordingFolder } from '@/utils/folders/recordingFolder';
import { isRecordingProcessing } from '@/utils/recording/recordingContentEmoji';
import { RecordingAvatar } from '@/components/features/recording/RecordingAvatar';
import { useCreateStyles, useThemedColors, Spacing, BorderRadius, withAppFont } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';

interface Props {
  recording: Recording;
  /** Dense tile layout for folder grid view. */
  compact?: boolean;
}

export function RecordingCard({ recording, compact }: Props) {
  const styles = useCreateStyles(createRecordingCardStyles);
  const colors = useThemedColors();
  const isProcessing = isRecordingProcessing(recording);
  const isFavorite = !!recording.isFavorite;
  const folder = resolveRecordingFolder(recording);
  const isRecentlyDeleted = folder === 'recently-deleted';

  const dateText =
    isRecentlyDeleted && recording.deletedAt
      ? `Deleted ${formatDate(recording.deletedAt)}`
      : formatDate(recording.createdAt);

  const topRightIcons = (
    <View style={styles.topRightIcons}>
      {isFavorite && !isRecentlyDeleted && (
        <View style={[styles.statusIcon, styles.favoriteIcon]}>
          <Ionicons name="star" size={compact ? 12 : 14} color="#FFD60A" />
        </View>
      )}
    </View>
  );

  if (compact) {
    return (
      <View style={[styles.card, styles.cardCompact]}>
          <RecordingAvatar recording={recording} size="compact" />

          <View style={styles.contentCompactInner}>
            <View style={styles.titleRowCompact}>
              <Text style={styles.titleCompact} numberOfLines={2}>
                {recording.title}
              </Text>
              {(isProcessing || (isFavorite && !isRecentlyDeleted)) && (
                <View style={styles.compactTitleIcons}>{topRightIcons}</View>
              )}
            </View>
            <Text style={styles.dateCompact}>{dateText}</Text>
            <View style={styles.durationRowCompact}>
              <Text style={styles.durationCompact}>{formatDuration(recording.duration)}</Text>
            </View>
          </View>
      </View>
    );
  }

  return (
      <View style={styles.card}>
        <RecordingAvatar recording={recording} />

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {recording.title}
            </Text>
            {(isProcessing || (isFavorite && !isRecentlyDeleted)) && topRightIcons}
          </View>
          <Text style={styles.date}>{dateText}</Text>
          <View style={styles.durationRow}>
            <Text style={styles.duration}>{formatDuration(recording.duration)}</Text>
          </View>
        </View>
      </View>
  );
}

function createRecordingCardStyles(c: ColorPalette) {
  return StyleSheet.create({
  card: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.card,
    borderRadius: BorderRadius.cardXL,
    padding: Spacing.md,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
  },
  cardCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: Spacing.md,
    marginBottom: 0,
    minHeight: 148,
  },
  topRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  compactTitleIcons: {
    marginLeft: 6,
    flexShrink: 0,
  },
  statusIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    backgroundColor: 'rgba(255,159,10,0.16)',
  },
  content: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  contentCompactInner: {
    width: '100%',
    alignItems: 'stretch',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  titleRowCompact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  title: withAppFont({
    flex: 1,
    minWidth: 0,
    fontSize: 18,
    fontWeight: '600',
    color: c.textPrimary,
    lineHeight: 22,
    textAlign: 'left',
  }),
  titleCompact: withAppFont({
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '600',
    color: c.textPrimary,
    lineHeight: 20,
    textAlign: 'left',
  }),
  date: withAppFont({
    fontSize: 14,
    color: c.subtext,
    textAlign: 'left',
    marginBottom: 6,
  }),
  dateCompact: withAppFont({
    fontSize: 13,
    color: c.subtext,
    textAlign: 'left',
    marginBottom: 6,
  }),
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  durationRowCompact: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  duration: withAppFont({
    fontSize: 14,
    color: c.subtext,
    textAlign: 'right',
  }),
  durationCompact: withAppFont({
    fontSize: 13,
    color: c.subtext,
    textAlign: 'right',
  }),
  });
}
