import { darkColors, lightColors, type ColorPalette } from './colorPalettes';
import type { ResolvedColorScheme } from '@/shared/utils/theme/themePreference';

export { Spacing, BorderRadius } from '@briefly/theme';

/** Live palette synced by {@link ThemeProvider}. Prefer {@link useThemedColors} in components. */
export const Colors: ColorPalette = { ...darkColors };
export function applyColorPalette(scheme: ResolvedColorScheme): void {
  const next = scheme === 'light' ? lightColors : darkColors;
  Object.assign(Colors, next);
}
