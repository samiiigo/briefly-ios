import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CircularIconButton } from '@/components/ui/CircularIconButton';
import {
  TOP_HEADER_BUTTON_ROW_HEIGHT,
  TOP_HEADER_PADDING_BOTTOM,
  TOP_HEADER_PADDING_TOP,
} from '@/components/navigation/layout/topHeaderMetrics';
import { TopChromeOverlay } from '@/components/navigation/chrome/TopChromeOverlay';
import { useCreateStyles, Spacing, withAppFont } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';
interface Props {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  onAddFolder: () => void;
  onSearch?: () => void;
}
export function LibraryHeader({
  title = 'Library',
  showBack = false,
  onBack,
  onAddFolder,
  onSearch,
}: Props) {
  const styles = useCreateStyles(createLibraryHeaderStyles);
  return (
    <TopChromeOverlay>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {showBack ? (
            <CircularIconButton
              icon="arrow-back"
              accessibilityLabel="Back"
              onPress={onBack}
              style={styles.backButton}
            />
          ) : null}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View style={styles.actions}>
          <CircularIconButton
            icon="add"
            accessibilityLabel="New folder"
            onPress={onAddFolder}
          />
          <CircularIconButton
            icon="search"
            accessibilityLabel="Search"
            onPress={onSearch}
          />
        </View>
      </View>
    </TopChromeOverlay>
  );
}
function createLibraryHeaderStyles(c: ColorPalette) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingTop: TOP_HEADER_PADDING_TOP,
      paddingBottom: TOP_HEADER_PADDING_BOTTOM,
      minHeight: TOP_HEADER_BUTTON_ROW_HEIGHT + TOP_HEADER_PADDING_TOP + TOP_HEADER_PADDING_BOTTOM,
    },
    titleRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 0,
      marginRight: Spacing.md,
    },
    backButton: {
      marginRight: Spacing.sm,
    },
    title: withAppFont({
      flexShrink: 1,
      fontSize: 36,
      fontWeight: '700',
      color: c.textPrimary,
      letterSpacing: -0.5,
    }),
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
  });
}
