import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { SEARCH_FILTER_PILLS, SearchFilterId } from '@/constants/search';
import { Colors, BorderRadius, Spacing, withAppFont } from '@/theme';

interface Props {
  selected: SearchFilterId;
  onSelect: (id: SearchFilterId) => void;
}

export function SearchFilterPills({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
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
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
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
