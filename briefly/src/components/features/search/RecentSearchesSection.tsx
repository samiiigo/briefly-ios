import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  RECORDING_LIST_HEADER_GAP,
  RECORDING_LIST_ITEM_GAP,
} from '@/utils/list/flattenRecordingSections';
import { Colors, BorderRadius, Spacing, withAppFont } from '@/theme';

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
      <View style={styles.list}>
        {queries.map((query) => (
          <RecentSearchRow
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

function RecentSearchRow({
  query,
  onPress,
  onRemove,
}: {
  query: string;
  onPress: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.card}>
      <Pressable
        style={styles.leading}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Search for ${query}`}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="search" size={20} color={Colors.subtext} />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {query}
        </Text>
      </Pressable>
      <Pressable
        onPress={onRemove}
        hitSlop={10}
        style={styles.removeButton}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${query} from recent searches`}
      >
        <Ionicons name="close" size={18} color={Colors.subtext} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: RECORDING_LIST_HEADER_GAP,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
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
  list: {
    gap: RECORDING_LIST_ITEM_GAP,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
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
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: withAppFont({
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 22,
  }),
  removeButton: {
    padding: 4,
  },
});
