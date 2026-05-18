import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CircularIconButton } from '@/components/ui/CircularIconButton';
import { TopChromeOverlay } from '@/components/navigation/TopChromeOverlay';
import { SearchField, type SearchFieldHandle } from './SearchField';
import { SEARCH_CHROME_HORIZONTAL_PADDING } from './searchLayout';
import { Spacing } from '@/theme';

interface Props {
  query: string;
  onChangeText: (text: string) => void;
  onClearQuery: () => void;
  onSubmit: () => void;
  onClose: () => void;
  fieldRef?: React.RefObject<SearchFieldHandle | null>;
}

export function SearchTopChrome({
  query,
  onChangeText,
  onClearQuery,
  onSubmit,
  onClose,
  fieldRef,
}: Props) {
  return (
    <TopChromeOverlay>
      <View style={styles.chrome}>
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
      </View>
    </TopChromeOverlay>
  );
}

const styles = StyleSheet.create({
  chrome: {
    paddingHorizontal: SEARCH_CHROME_HORIZONTAL_PADDING,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cancelButton: {
    flexShrink: 0,
  },
});
