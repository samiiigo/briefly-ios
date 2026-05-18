import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CircularIconButton } from '@/components/ui/CircularIconButton';
import { SearchField, type SearchFieldHandle } from './SearchField';
import { ScrollRevealSearchFilters } from './ScrollRevealSearchFilters';
import { SearchFilterId } from '@/constants/search';
import { SEARCH_CHROME_HORIZONTAL_PADDING } from './searchLayout';
import { Colors, Spacing } from '@/theme';
import type { SharedValue } from 'react-native-reanimated';

interface Props {
  topInset: number;
  query: string;
  onChangeText: (text: string) => void;
  onClearQuery: () => void;
  onSubmit: () => void;
  onClose: () => void;
  filterId: SearchFilterId;
  onFilterSelect: (id: SearchFilterId) => void;
  filterReveal: SharedValue<number>;
  fieldRef?: React.RefObject<SearchFieldHandle | null>;
}

export function SearchTopChrome({
  topInset,
  query,
  onChangeText,
  onClearQuery,
  onSubmit,
  onClose,
  filterId,
  onFilterSelect,
  filterReveal,
  fieldRef,
}: Props) {
  return (
    <View style={[styles.chrome, { paddingTop: topInset + Spacing.sm }]}>
      <View style={styles.searchRow}>
        <SearchField
          ref={fieldRef}
          value={query}
          onChangeText={onChangeText}
          onClear={onClearQuery}
          onSubmit={onSubmit}
        />
        <CircularIconButton
          icon="close"
          accessibilityLabel="Close search"
          onPress={onClose}
          style={styles.cancelButton}
        />
      </View>
      <ScrollRevealSearchFilters
        progress={filterReveal}
        selected={filterId}
        onSelect={onFilterSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chrome: {
    backgroundColor: Colors.background,
    paddingHorizontal: SEARCH_CHROME_HORIZONTAL_PADDING,
    paddingBottom: Spacing.sm,
    zIndex: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  cancelButton: {
    flexShrink: 0,
  },
});
