import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { RECORDING_LIST_HEADER_GAP } from '@/utils/list/flattenRecordingSections';
import { RecentSearchCard } from './RecentSearchCard';
import { Colors, Spacing, withAppFont } from '@/theme';

interface Props {
  queries: string[];
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
  onClearAll: () => void;
}

export function RecentSearchesSection({
  queries,
  onSelect,
  onRemove,
  onClearAll,
}: Props) {
  if (queries.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionHeader}>Recent Searches</Text>
        <Pressable onPress={onClearAll} hitSlop={8} accessibilityRole="button">
          <Text style={styles.clearAll}>Clear All</Text>
        </Pressable>
      </View>
      <View>
        {queries.map((query) => (
          <RecentSearchCard
            key={query}
            query={query}
            onPress={() => onSelect(query)}
            onRemove={() => onRemove(query)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: RECORDING_LIST_HEADER_GAP,
    /** Align with {@link SearchField} / {@link SearchResultItem} inner content inset. */
    paddingLeft: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeader: withAppFont({
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 16,
    color: Colors.subtext,
  }),
  clearAll: withAppFont({
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary,
  }),
});
