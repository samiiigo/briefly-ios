/**
 * Platform-aware design tokens for cross-platform theming.
 *
 * Provides shadows, corner radii, and font stacks that respect
 * iOS (SF Pro, iOS shadows) and Android (Roboto, Material elevation)
 * conventions, while sharing a common color palette and spacing scale.
 */

import { Platform, type ViewStyle, type TextStyle } from 'react-native';
import { Colors, Spacing, BorderRadius } from './index';

// ─── Font Stacks ────────────────────────────────────────────────────────
export const FontStack = Platform.select({
  ios: {
    text: 'SF Pro Text' as const,
    display: 'SF Pro Display' as const,
    serif: 'Georgia' as const,
  },
  android: {
    text: 'Roboto' as const,
    display: 'Roboto' as const,
    serif: 'serif' as const,
  },
  default: {
    text: undefined,
    display: undefined,
    serif: undefined,
  },
})!;

// ─── Shadows / Elevation ────────────────────────────────────────────────
export type ShadowToken = ViewStyle;

/** Card-level shadow / elevation. */
export const shadowCard: ShadowToken = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  android: {
    elevation: 4,
  },
  default: {},
})!;

/** Elevated surface shadow (modals, sheets). */
export const shadowElevated: ShadowToken = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  android: {
    elevation: 8,
  },
  default: {},
})!;

/** High-prominence shadow (floating buttons, overlays). */
export const shadowHigh: ShadowToken = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
  },
  android: {
    elevation: 12,
  },
  default: {},
})!;

// ─── Corner Radii (platform-tuned) ─────────────────────────────────────
export const CornerRadius = {
  /** Tighter on Android for Material feel; softer on iOS. */
  sm: Platform.select({ ios: 8, android: 6, default: 8 })!,
  md: Platform.select({ ios: 12, android: 10, default: 12 })!,
  lg: Platform.select({ ios: 16, android: 14, default: 16 })!,
  xl: Platform.select({ ios: 20, android: 16, default: 20 })!,
  card: Platform.select({ ios: 24, android: 20, default: 24 })!,
  full: 9999,
} as const;

// ─── Full Token Set ─────────────────────────────────────────────────────
export interface ThemeTokens {
  colors: typeof Colors;
  spacing: typeof Spacing;
  borderRadius: typeof BorderRadius;
  cornerRadius: typeof CornerRadius;
  fontStack: typeof FontStack;
  shadow: {
    card: ShadowToken;
    elevated: ShadowToken;
    high: ShadowToken;
  };
}

function buildTokens(): ThemeTokens {
  return {
    colors: Colors,
    spacing: Spacing,
    borderRadius: BorderRadius,
    cornerRadius: CornerRadius,
    fontStack: FontStack,
    shadow: {
      card: shadowCard,
      elevated: shadowElevated,
      high: shadowHigh,
    },
  };
}

/** Singleton token set resolved once at import time. */
const tokens: ThemeTokens = buildTokens();

/**
 * Returns the platform-aware design token set.
 *
 * Safe to call as a plain function (not a hook) since
 * `Platform.OS` never changes at runtime. Named `useTheme`
 * for ergonomic consistency with hooks-based consumption.
 */
export function useTheme(): ThemeTokens {
  return tokens;
}
