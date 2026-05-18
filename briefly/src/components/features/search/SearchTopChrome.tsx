import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CircularIconButton } from '@/components/ui/CircularIconButton';
import {
  TOP_HEADER_BUTTON_ROW_HEIGHT,
  TOP_HEADER_PADDING_BOTTOM,
  TOP_HEADER_PADDING_TOP,
} from '@/components/navigation/topHeaderMetrics';
import { TopChromeOverlay } from '@/components/navigation/TopChromeOverlay';
import { screenGutterStyles } from '@/components/navigation/screenGutter';
import { SearchField, type SearchFieldHandle } from './SearchField';
import { Spacing } from '@/theme';

interface Props {
  query: string;
  onChangeText: (text: string) => void;
  onClearQuery: () => void;
  onSubmit: () => void;
  onBlur?: () => void;
  onClose: () => void;
  fieldRef?: React.RefObject<SearchFieldHandle | null>;
}

export function SearchTopChrome({
  query,
  onChangeText,
  onClearQuery,
  onSubmit,
  onBlur,
  onClose,
  fieldRef,
}: Props) {
  return (
    <TopChromeOverlay>
      <View style={styles.header}>
        <View style={styles.searchHost}>
          <SearchField
            ref={fieldRef}
            value={query}
            onChangeText={onChangeText}
            onClear={onClearQuery}
            onSubmit={onSubmit}
            onBlur={onBlur}
          />
        </View>
        <View style={[styles.actions, screenGutterStyles.headerActions]}>
          <CircularIconButton
            icon="close"
            accessibilityLabel="Close search"
            onPress={onClose}
          />
        </View>
      </View>
    </TopChromeOverlay>
  );
}

const styles = StyleSheet.create({
  header: {
    ...screenGutterStyles.headerRow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: TOP_HEADER_PADDING_TOP,
    paddingBottom: TOP_HEADER_PADDING_BOTTOM,
    minHeight: TOP_HEADER_BUTTON_ROW_HEIGHT + TOP_HEADER_PADDING_TOP + TOP_HEADER_PADDING_BOTTOM,
  },
  searchHost: {
    flex: 1,
    minWidth: 0,
    marginRight: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
});
