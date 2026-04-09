import { Platform, Easing, TextStyle } from 'react-native';

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
  textTertiary: '#48484A',

  onDeviceBadge: 'rgba(52, 199, 89, 0.15)',
  onDeviceText: '#34C759',
  cloudBadge: '#0A2A5C',
  cloudText: '#007AFF',

  waveform: '#007AFF',
  waveformGlow: 'rgba(0,122,255,0.3)',
  recordButton: '#FF3B30',
  pauseButton: '#3A3A3C',
};

/**
 * iOS large-title treatment: SF Pro Display at 34pt (Apple uses Display for sizes above ~20pt).
 * Matches common HIG mocks: 700 weight, ~0.4px tracking. Collapse-to-inline title on scroll
 * requires native navigation large-title behavior; tab screens use this for the expanded look.
 */
const largeTitleBase: TextStyle = {
  fontSize: 34,
  fontWeight: '700',
  letterSpacing: 0.4,
  color: Colors.textPrimary,
  ...Platform.select({
    ios: { fontFamily: 'SF Pro Display' },
    default: {},
  }),
};

export const Typography = {
  largeTitle: largeTitleBase,
  title1: { fontSize: 28, fontWeight: '700' as const, color: Colors.textPrimary },
  title2: { fontSize: 22, fontWeight: '700' as const, color: Colors.textPrimary },
  title3: { fontSize: 20, fontWeight: '600' as const, color: Colors.textPrimary },
  headline: { fontSize: 17, fontWeight: '600' as const, color: Colors.textPrimary },
  body: { fontSize: 17, fontWeight: '400' as const, color: Colors.textPrimary },
  callout: { fontSize: 16, fontWeight: '400' as const, color: Colors.textPrimary },
  subhead: { fontSize: 15, fontWeight: '400' as const, color: Colors.textPrimary },
  footnote: { fontSize: 13, fontWeight: '400' as const, color: Colors.textSecondary },
  caption1: { fontSize: 12, fontWeight: '400' as const, color: Colors.textSecondary },
  caption2: { fontSize: 11, fontWeight: '400' as const, color: Colors.textSecondary },
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
