import React, { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchFolderResult } from '@/utils/search/searchEngine';
import { HighlightedText } from './HighlightedText';
import { Colors, BorderRadius, Spacing, withAppFont } from '@/theme';

interface Props {
  folder: SearchFolderResult;
  query: string;
  onPress: () => void;
}

function SearchFolderChipComponent({ folder, query, onPress }: Props) {
  return (
    <Pressable
      style={styles.chip}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={folder.name}
    >
      <Ionicons name={folder.icon as any} size={16} color={Colors.subtext} style={styles.icon} />
      <HighlightedText
        text={folder.name}
        query={query}
        style={styles.label}
        numberOfLines={1}
      />
    </Pressable>
  );
}

export const SearchFolderChip = memo(SearchFolderChipComponent);

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.full,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
    gap: Spacing.xs,
    maxWidth: 220,
  },
  icon: {
    flexShrink: 0,
  },
  label: withAppFont({
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    flexShrink: 1,
  }),
});
