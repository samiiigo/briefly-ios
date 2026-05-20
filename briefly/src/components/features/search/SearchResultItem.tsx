import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recording } from '@/types';
import { formatRecentsCardDate } from '@/utils';
import { RecordingAvatar } from '@/components/features/recording/RecordingAvatar';
import { HighlightedText } from './HighlightedText';
import { useCreateStyles, useThemedColors, BorderRadius, Spacing, withAppFont } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';

interface Props {
  recording: Recording;
  query: string;
  onPress: () => void;
}

function SearchResultItemComponent({ recording, query, onPress }: Props) {
  const styles = useCreateStyles(createSearchResultItemStyles);
  const colors = useThemedColors();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      <View style={styles.leading}>
        <RecordingAvatar recording={recording} trailingSpacing={false} />
        <View style={styles.textBlock}>
          <HighlightedText
            text={recording.title}
            query={query}
            style={styles.title}
            numberOfLines={1}
          />
          <Text style={styles.subtitle} numberOfLines={1}>
            {formatRecentsCardDate(recording.createdAt)}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.subtext} />
    </TouchableOpacity>
  );
}

export const SearchResultItem = memo(SearchResultItemComponent);

function createSearchResultItemStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.card,
      borderRadius: BorderRadius.cardXL,
      padding: Spacing.md,
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
