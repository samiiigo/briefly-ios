import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CircularIconButton } from '@/components/ui/CircularIconButton';
import {
  TOP_HEADER_BUTTON_ROW_HEIGHT,
  TOP_HEADER_PADDING_BOTTOM,
  TOP_HEADER_PADDING_TOP,
} from '@/components/navigation/topHeaderMetrics';
import { TopChromeOverlay } from '@/components/navigation/TopChromeOverlay';
import { SearchField } from './SearchField';
import { ScrollRevealSearchFilters } from './ScrollRevealSearchFilters';
import { SearchFilterId } from '@/constants/search';
import { Colors, Spacing, withAppFont } from '@/theme';
import type { SharedValue } from 'react-native-reanimated';

interface Props {
  query: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  filterReveal: SharedValue<number>;
  filterId: SearchFilterId;
  onFilterSelect: (id: SearchFilterId) => void;
}

export function SearchHeader({
  query,
  onChangeText,
  onClose,
  onSubmit,
  filterReveal,
  filterId,
  onFilterSelect,
}: Props) {
  return (
    <TopChromeOverlay>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <View style={styles.actions}>
          <CircularIconButton
            icon="close"
            accessibilityLabel="Close search"
            onPress={onClose}
          />
        </View>
      </View>
      <SearchField value={query} onChangeText={onChangeText} onSubmit={onSubmit} />
      <ScrollRevealSearchFilters
        progress={filterReveal}
        selected={filterId}
        onSelect={onFilterSelect}
      />
    </TopChromeOverlay>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: TOP_HEADER_PADDING_TOP,
    paddingBottom: TOP_HEADER_PADDING_BOTTOM,
    minHeight: TOP_HEADER_BUTTON_ROW_HEIGHT + TOP_HEADER_PADDING_TOP + TOP_HEADER_PADDING_BOTTOM,
  },
  title: withAppFont({
    fontSize: 36,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  }),
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
});
