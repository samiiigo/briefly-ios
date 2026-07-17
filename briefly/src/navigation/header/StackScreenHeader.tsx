import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircularIconButton } from '@/shared/components/ui/CircularIconButton';
import {
  TOP_HEADER_BUTTON_ROW_HEIGHT,
  TOP_HEADER_PADDING_BOTTOM,
  TOP_HEADER_PADDING_TOP,
} from '@/navigation/layout/topHeaderMetrics';
import {
  getSettingsHeaderTopInset,
  SETTINGS_TOP_HEADER_BODY_HEIGHT,
  SETTINGS_TOP_HEADER_PADDING_BOTTOM,
  SETTINGS_TOP_HEADER_PADDING_TOP,
  SETTINGS_TOP_HEADER_TITLE_FONT_SIZE,
} from '@/navigation/layout/settingsTopHeaderMetrics';
import { TopChromeOverlay } from '@/navigation/chrome/TopChromeOverlay';
import { useCreateStyles, Spacing, withAppFont } from '@/shared/theme';
import type { ColorPalette } from '@/shared/theme/colorPalettes';
interface Props {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  /** Leading control when `showBack` is true (defaults to arrow-back). */
  leadingIcon?: 'arrow-back' | 'chevron-back' | 'close';
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
  buttonStyle?: StyleProp<ViewStyle>;
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
  buttonStyle,
}: Props) {
  const styles = useCreateStyles(createStackScreenHeaderStyles);
  const insets = useSafeAreaInsets();
  const hasLeading = Boolean(leading ?? (showBack && onBack));
  const hasTrailing = Boolean(trailing);
  const absoluteCenter = Boolean(centerTitle && (hasLeading || hasTrailing));
  const rowCenter = Boolean(centerTitle && !hasLeading && !hasTrailing);
  const usesSettingsMetrics = titleSize === 'nav';
  const titleStyle = [
    styles.title,
    usesSettingsMetrics && styles.titleNav,
    (absoluteCenter || rowCenter) && styles.titleCentered,
  ];
  return (
    <TopChromeOverlay
      paddingInset={usesSettingsMetrics ? getSettingsHeaderTopInset(insets.top) : undefined}
    >
      <View
        style={[
          styles.header,
          usesSettingsMetrics && styles.settingsHeader,
          rowCenter && styles.headerCentered,
        ]}
      >
        {absoluteCenter ? (
          <View
            pointerEvents="none"
            style={[
              styles.absoluteTitle,
              usesSettingsMetrics && styles.settingsAbsoluteTitle,
            ]}
          >
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
                style={[styles.backButton, buttonStyle]}
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
  settingsHeader: {
    paddingTop: SETTINGS_TOP_HEADER_PADDING_TOP,
    paddingBottom: SETTINGS_TOP_HEADER_PADDING_BOTTOM,
    minHeight: SETTINGS_TOP_HEADER_BODY_HEIGHT,
  },
  absoluteTitle: {
    position: 'absolute',
    top: TOP_HEADER_PADDING_TOP,
    right: 0,
    bottom: TOP_HEADER_PADDING_BOTTOM,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsAbsoluteTitle: {
    top: SETTINGS_TOP_HEADER_PADDING_TOP,
    bottom: SETTINGS_TOP_HEADER_PADDING_BOTTOM,
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
    fontSize: SETTINGS_TOP_HEADER_TITLE_FONT_SIZE,
    lineHeight: 22,
    fontWeight: '600',
    color: c.textPrimary,
    letterSpacing: -0.2,
    includeFontPadding: false,
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
