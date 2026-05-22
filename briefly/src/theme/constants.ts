import { darkColors, lightColors, type ColorPalette } from './colorPalettes';
import type { ResolvedColorScheme } from '@/utils/theme/themePreference';
/** Live palette synced by {@link ThemeProvider}. Prefer {@link useThemedColors} in components. */
export const Colors: ColorPalette = { ...darkColors };
export function applyColorPalette(scheme: ResolvedColorScheme): void {
  const next = scheme === 'light' ? lightColors : darkColors;
  Object.assign(Colors, next);
}
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
