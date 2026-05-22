import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recording } from '@/types';
import { formatRecentsCardDate } from '@/utils';
import type { RecordingListGroupPosition } from '@/utils/list/flattenRecordingSections';
import { RecordingAvatar } from '@/components/features/recording/RecordingAvatar';
import { isRecordingProcessing } from '@/utils/recording/recordingContentEmoji';
import { isInitialProcessingFailure } from '@/utils/recording/recordingEntryAccess';
import { useRecordingProcessingRetry } from '@/hooks/useRecordingProcessingRetry';
import { useCreateStyles, useThemedColors, BorderRadius, Spacing, withAppFont } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';

const AVATAR_SIZE = 48;
const CHEVRON_SIZE = 16;

interface Props {
  recording: Recording;
  /** Position within a time-grouped card (Today, Yesterday, …). */
  groupPosition?: RecordingListGroupPosition;
}

function groupedCardStyle(position: RecordingListGroupPosition, c: ColorPalette) {
  const radius = BorderRadius.cardXL;
  const shared = {
    backgroundColor: c.card,
    overflow: 'hidden' as const,
  };
  switch (position) {
    case 'only':
      return { ...shared, borderRadius: radius };
    case 'first':
      return {
        ...shared,
        borderTopLeftRadius: radius,
        borderTopRightRadius: radius,
      };
    case 'middle':
      return shared;
    case 'last':
      return {
        ...shared,
        borderBottomLeftRadius: radius,
        borderBottomRightRadius: radius,
      };
  }
}

export function RecentsEntryCard({ recording, groupPosition = 'only' }: Props) {
  const styles = useCreateStyles(createRecentsEntryCardStyles);
  const colors = useThemedColors();
  const showDivider = groupPosition === 'middle' || groupPosition === 'last';
  const processing = isRecordingProcessing(recording);
  const initialFailure = isInitialProcessingFailure(recording);
  const { action: retryAction } = useRecordingProcessingRetry(recording, {
    forListAvatar: true,
  });
  const showRerunTrailing = initialFailure && retryAction != null;

  return (
      <View style={groupedCardStyle(groupPosition, colors)}>
        {showDivider ? (
          <View
            style={[
              styles.rowDivider,
              processing ? styles.rowDividerProcessing : null,
            ]}
          />
        ) : null}
        <View style={styles.row}>
          <View style={styles.leading}>
            <RecordingAvatar recording={recording} trailingSpacing={false} listRow />
            <View style={styles.textBlock}>
              <Text style={styles.title} numberOfLines={1}>
                {recording.title}
              </Text>
              <Text style={styles.subtitle}>{formatRecentsCardDate(recording.createdAt)}</Text>
            </View>
          </View>
          {showRerunTrailing ? (
            <Ionicons name="refresh-outline" size={18} color={colors.orange} />
          ) : !processing ? (
            <Ionicons name="chevron-forward" size={16} color={colors.subtext} />
          ) : null}
        </View>
      </View>
  );
}

function createRecentsEntryCardStyles(c: ColorPalette) {
  return StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.border,
    marginLeft: Spacing.md + AVATAR_SIZE + Spacing.md,
    marginRight: Spacing.md + CHEVRON_SIZE + Spacing.sm,
  },
  rowDividerProcessing: {
    marginRight: Spacing.md,
  },
  leading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minWidth: 0,
    marginRight: Spacing.sm,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: withAppFont({
    fontSize: 18,
    fontWeight: '600',
    color: c.textPrimary,
    lineHeight: 22,
    marginBottom: 4,
  }),
  subtitle: withAppFont({
    fontSize: 14,
    color: c.subtext,
  }),
  });
}
