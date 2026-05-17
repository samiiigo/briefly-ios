import { Easing, Platform } from 'react-native';
import { appFont, withAppFont } from './fonts';

export {
  Fonts,
  fontFamilyForSize,
  withAppFont,
  withSerifFont,
  appFont,
  SF_DISPLAY_MIN_SIZE,
} from './fonts';
export { installAppFonts } from './installAppFonts';

export const Colors = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  card: '#1C1C1E',
  border: '#38383A',

  primary: '#0A84FF',
  primaryDark: '#0056b3',
  red: '#FF3B30',
  green: '#34C759',
  orange: '#FF9F0A',
  purple: '#BF5AF2',

  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  /** Recents feed secondary labels (matches design mock). */
  subtext: '#98989E',
  textTertiary: '#48484A',
  danger: '#FF453A',

  onDeviceBadge: 'rgba(52, 199, 89, 0.15)',
  onDeviceText: '#34C759',
  cloudBadge: '#0A2A5C',
  cloudText: '#007AFF',

  waveform: '#007AFF',
  waveformGlow: 'rgba(0,122,255,0.3)',
  recordButton: '#FF3B30',
  pauseButton: '#3A3A3C',

  /** Recording detail / summary screen (design mock). */
  insightCard: '#121212',
  insightAccent: '#0D99FF',
  summaryMuted: '#9CA3AF',
  summaryBody: '#E3E3E3',
  emojiCircleBorder: '#374151',
  headerButtonMuted: '#2B2D2D',
};

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

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  /** Horizontal inset for screen edges, headers, and list content (iOS-style 20pt gutter). */
  screenHorizontal: 20,
  contentTop: 0,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  /** Entry cards on the recents feed (rounded-3xl). */
  cardXL: 24,
  full: 9999,
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
