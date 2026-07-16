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
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  /** Leading control when `showBack` is true (defaults to arrow-back). */
  leadingIcon?: 'arrow-back' | 'close';
  trailing?: React.ReactNode;
  /** Custom leading control (replaces the default back button). */
  leading?: React.ReactNode;
  /**
   * Center the title. With trailing/leading chrome, the title is absolutely
   * centered in the bar (modal-style). Without chrome, the row itself centers.
   */
  centerTitle?: boolean;
  /** `large` matches Recents/Library; `nav` is a compact centered modal title. */
  titleSize?: 'large' | 'nav';
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
  titleSize = 'large',
}: Props) {
  const styles = useCreateStyles(createStackScreenHeaderStyles);
  const hasLeading = Boolean(leading ?? (showBack && onBack));
  const hasTrailing = Boolean(trailing);
  const absoluteCenter = Boolean(centerTitle && (hasLeading || hasTrailing));
  const rowCenter = Boolean(centerTitle && !hasLeading && !hasTrailing);
  const titleStyle = [
    styles.title,
    titleSize === 'nav' && styles.titleNav,
    (absoluteCenter || rowCenter) && styles.titleCentered,
  ];
  return (
    <TopChromeOverlay>
      <View style={[styles.header, rowCenter && styles.headerCentered]}>
        {absoluteCenter ? (
          <View pointerEvents="none" style={styles.absoluteTitle}>
            <Text style={titleStyle} numberOfLines={1}>
              {title}
            </Text>
          </View>
        ) : null}
        <View
          style={[
            styles.titleRow,
            rowCenter && styles.titleRowCentered,
            absoluteCenter && styles.titleRowSpread,
          ]}
        >
          {leading ??
            (showBack && onBack ? (
              <CircularIconButton
                icon={leadingIcon}
                accessibilityLabel={leadingIcon === 'close' ? 'Close' : 'Back'}
                onPress={onBack}
                style={styles.backButton}
              />
            ) : absoluteCenter ? (
              <View style={styles.sideSpacer} />
            ) : null)}
          {absoluteCenter ? null : (
            <Text style={titleStyle} numberOfLines={1}>
              {title}
            </Text>
          )}
        </View>
        {hasTrailing ? (
          <View style={styles.trailing}>{trailing}</View>
        ) : absoluteCenter ? (
          <View style={styles.sideSpacer} />
        ) : null}
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
  absoluteTitle: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
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
  titleRowSpread: {
    marginRight: 0,
  },
  sideSpacer: {
    width: 44,
    height: 44,
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
  titleNav: withAppFont({
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '600',
    color: c.textPrimary,
    letterSpacing: -0.2,
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
