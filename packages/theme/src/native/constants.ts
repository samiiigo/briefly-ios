import { darkColors, lightColors, type ColorPalette } from '../colorPalettes';
import type { ResolvedColorScheme } from './themePreference';
/** Live palette synced by {@link ThemeProvider}. Prefer {@link useThemedColors} in components. */
export const Colors: ColorPalette = { ...darkColors };
export function applyColorPalette(scheme: ResolvedColorScheme): void {
  const next = scheme === 'light' ? lightColors : darkColors;
  Object.assign(Colors, next);
}
export { Spacing, BorderRadius } from '../spacing';
