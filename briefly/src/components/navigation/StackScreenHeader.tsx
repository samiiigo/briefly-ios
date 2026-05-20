import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CircularIconButton } from '@/components/ui/CircularIconButton';
import {
  TOP_HEADER_BUTTON_ROW_HEIGHT,
  TOP_HEADER_PADDING_BOTTOM,
  TOP_HEADER_PADDING_TOP,
} from '@/components/navigation/topHeaderMetrics';
import { TopChromeOverlay } from '@/components/navigation/TopChromeOverlay';
import { useCreateStyles, Spacing, withAppFont } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';

interface Props {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  /** Leading control when `showBack` is true (defaults to arrow-back). */
  leadingIcon?: 'arrow-back' | 'close';
  trailing?: React.ReactNode;
  /** Custom leading control (replaces the default back button). */
  leading?: React.ReactNode;
  /** Center the title when there is no leading or trailing chrome. */
  centerTitle?: boolean;
}

/** Large-title header row aligned with Recents / Library tabs. */
export function StackScreenHeader({
  title,
  showBack,
  onBack,
  leadingIcon = 'arrow-back',
  trailing,
  leading,
  centerTitle,
}: Props) {
  const styles = useCreateStyles(createStackScreenHeaderStyles);
  const hasLeading = Boolean(leading ?? (showBack && onBack));
  const hasTrailing = Boolean(trailing);
  const shouldCenterTitle = centerTitle && !hasLeading && !hasTrailing;

  return (
    <TopChromeOverlay>
      <View style={[styles.header, shouldCenterTitle && styles.headerCentered]}>
        <View style={[styles.titleRow, shouldCenterTitle && styles.titleRowCentered]}>
          {leading ??
            (showBack && onBack ? (
              <CircularIconButton
                icon={leadingIcon}
                accessibilityLabel={leadingIcon === 'close' ? 'Close' : 'Back'}
                onPress={onBack}
                style={styles.backButton}
              />
            ) : null)}
          <Text
            style={[styles.title, shouldCenterTitle && styles.titleCentered]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        {hasTrailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
    </TopChromeOverlay>
  );
}

function createStackScreenHeaderStyles(c: ColorPalette) {
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
  headerCentered: {
    justifyContent: 'center',
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    marginRight: Spacing.md,
  },
  titleRowCentered: {
    flex: 0,
    marginRight: 0,
    justifyContent: 'center',
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
  titleCentered: {
    textAlign: 'center',
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  });
}
