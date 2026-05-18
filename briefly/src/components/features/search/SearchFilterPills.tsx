import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { SEARCH_FILTER_PILLS, SearchFilterId } from '@/constants/search';
import { Colors, BorderRadius, Spacing, withAppFont } from '@/theme';

interface Props {
  selected: SearchFilterId;
  onSelect: (id: SearchFilterId) => void;
  /** Tighter bottom padding when used inside scroll-reveal chrome. */
  compact?: boolean;
}

export function SearchFilterPills({ selected, onSelect, compact = false }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.content, compact && styles.contentCompact]}
      style={styles.scroll}
    >
      {SEARCH_FILTER_PILLS.map((pill) => {
        const active = pill.id === selected;
        return (
          <Pressable
            key={pill.id}
            onPress={() => onSelect(pill.id)}
            style={[styles.pill, active && styles.pillActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Filter ${pill.label}`}
          >
            <Text style={[styles.pillLabel, active && styles.pillLabelActive]}>
              {pill.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: 0,
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
    flexWrap: 'nowrap',
  },
  contentCompact: {
    paddingBottom: 0,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevated,
  },
  pillActive: {
    backgroundColor: Colors.textPrimary,
  },
  pillLabel: withAppFont({
    fontSize: 15,
    fontWeight: '500',
    color: Colors.subtext,
  }),
  pillLabelActive: {
    color: Colors.background,
  },
});
