import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchFolderResult } from '@/utils/search/searchEngine';
import { HighlightedText } from './HighlightedText';
import {
  folderIconBadgeBackground,
  folderIconColor,
} from '@/utils/folders/folderIconTheme';
import { useCreateStyles, useThemedColors, BorderRadius, Spacing, withAppFont } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';

interface Props {
  folder: SearchFolderResult;
  query: string;
  width: number;
  onPress: () => void;
}

function SearchFolderCardComponent({ folder, query, width, onPress }: Props) {
  const styles = useCreateStyles(createSearchFolderCardStyles);
  const colors = useThemedColors();
  const isUser = folder.folderType === 'user';
  const iconColor = folderIconColor(folder.folderType, folder.accent, colors);

  return (
    <Pressable
      style={[styles.card, { width }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={folder.name}
    >
      <Text style={styles.countBadge}>
        {folder.count} {folder.count === 1 ? 'item' : 'items'}
      </Text>
      <View
        style={[
          styles.iconBadge,
          { backgroundColor: folderIconBadgeBackground(folder.accent, isUser, colors) },
        ]}
      >
        <Ionicons name={folder.icon as any} size={22} color={iconColor} />
      </View>
      <HighlightedText
        text={folder.name}
        query={query}
        style={styles.name}
        numberOfLines={2}
      />
    </Pressable>
  );
}

export const SearchFolderCard = memo(SearchFolderCardComponent);

function createSearchFolderCardStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      position: 'relative',
      backgroundColor: c.card,
      borderRadius: BorderRadius.cardXL,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      minHeight: 98,
      justifyContent: 'space-between',
      marginRight: 12,
    },
    countBadge: withAppFont({
      position: 'absolute',
      top: 12,
      right: 12,
      fontSize: 14,
      color: c.subtext,
      zIndex: 1,
    }),
    iconBadge: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    name: withAppFont({
      fontSize: 18,
      fontWeight: '600',
      color: c.textPrimary,
      lineHeight: 22,
      paddingRight: 40,
    }),
  });
}
