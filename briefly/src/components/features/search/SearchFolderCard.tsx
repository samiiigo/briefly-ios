import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchFolderResult } from '@/utils/search/searchEngine';
import { HighlightedText } from './HighlightedText';
import { Colors, BorderRadius, Spacing, withAppFont } from '@/theme';

interface Props {
  folder: SearchFolderResult;
  query: string;
  width: number;
  onPress: () => void;
}

function folderIconBadgeBackground(accent: string, isUser: boolean): string {
  if (accent.startsWith('rgba')) {
    return 'rgba(255,255,255,0.08)';
  }
  const h = accent.replace('#', '');
  if (h.length !== 6) return 'rgba(255,255,255,0.08)';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${isUser ? 0.1 : 0.14})`;
}

function SearchFolderCardComponent({ folder, query, width, onPress }: Props) {
  const isUser = folder.folderType === 'user';

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
          { backgroundColor: folderIconBadgeBackground(folder.accent, isUser) },
        ]}
      >
        <Ionicons name={folder.icon as any} size={22} color={folder.accent} />
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

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: Colors.card,
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
    color: Colors.subtext,
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
    color: Colors.textPrimary,
    lineHeight: 22,
    paddingRight: 40,
  }),
});
