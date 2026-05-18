import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, withAppFont } from '@/theme';

interface Props {
  queries: string[];
  onSelect: (query: string) => void;
  onClearAll: () => void;
}

export function RecentSearchesSection({ queries, onSelect, onClearAll }: Props) {
  if (queries.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Recent Searches</Text>
        <Pressable onPress={onClearAll} hitSlop={8} accessibilityRole="button">
          <Text style={styles.clearAll}>Clear All</Text>
        </Pressable>
      </View>
      {queries.map((query) => (
        <Pressable
          key={query}
          style={styles.row}
          onPress={() => onSelect(query)}
          accessibilityRole="button"
          accessibilityLabel={`Search for ${query}`}
        >
          <Ionicons name="time-outline" size={18} color={Colors.subtext} />
          <Text style={styles.term} numberOfLines={1}>
            {query}
          </Text>
          <Ionicons name="arrow-up-outline" size={16} color={Colors.textTertiary} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Spacing.md,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  header: withAppFont({
    fontSize: 14,
    fontWeight: '500',
    color: Colors.subtext,
  }),
  clearAll: withAppFont({
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary,
  }),
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.sm,
  },
  term: withAppFont({
    flex: 1,
    fontSize: 17,
    color: Colors.textPrimary,
  }),
});
