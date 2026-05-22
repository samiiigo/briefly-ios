import { Easing, Platform } from 'react-native';
import { appFont, withAppFont } from './fonts';
import { Colors } from './constants';
export { Colors, Spacing, BorderRadius, applyColorPalette } from './constants';
export type { ColorPalette } from './colorPalettes';
export { ThemeProvider, useThemedColors, useResolvedColorScheme } from './ThemeProvider';
export { useCreateStyles } from './createStyles';
export {
  Fonts,
  fontFamilyForSize,
  withAppFont,
  withSerifFont,
  appFont,
  SF_DISPLAY_MIN_SIZE,
} from './fonts';
export { iconFonts } from './iconFonts';
export {
  useTheme,
  FontStack,
  CornerRadius,
  shadowCard,
  shadowElevated,
  shadowHigh,
} from './tokens';
export type { ThemeTokens, ShadowToken } from './tokens';
/** SF Pro scale — Display for ≥20pt, Text below (Apple HIG). */
export const Typography = {
  largeTitle: withAppFont({
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: Colors.textPrimary,
  }),
  title1: appFont(28, '700', Colors.textPrimary),
  title2: appFont(22, '700', Colors.textPrimary),
  title3: appFont(20, '600', Colors.textPrimary),
  headline: appFont(17, '600', Colors.textPrimary),
  body: appFont(17, '400', Colors.textPrimary),
  callout: appFont(16, '400', Colors.textPrimary),
  subhead: appFont(15, '400', Colors.textPrimary),
  footnote: appFont(13, '400', Colors.textSecondary),
  caption1: appFont(12, '400', Colors.textSecondary),
  caption2: appFont(11, '400', Colors.textSecondary),
};
/** Short, unobtrusive animation for sliders/progress (iOS HIG). */
export const SliderAnimation = {
  duration: 220,
  easing: Easing.out(Easing.cubic),
};
// Liquid glass simulation — uses blur + translucency on iOS,
// elevated surface on Android.
export const LiquidGlass = {
  // Used for cards and modal surfaces
  card: Platform.select({
    ios: {
      backgroundColor: 'rgba(28,28,30,0.85)',
      // BlurView wraps the component for actual blur
    },
    android: {
      backgroundColor: Colors.surface,
      elevation: 4,
    },
  }),
};
