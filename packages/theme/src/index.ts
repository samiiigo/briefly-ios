export type { ColorPalette } from './colorPalettes';
export { darkColors, lightColors } from './colorPalettes';
export { Spacing, BorderRadius } from './spacing';
export {
  colorPaletteToCssVariables,
  spacingToCssVariables,
  lightThemeCssVariables,
  darkThemeCssVariables,
  generateThemeCss,
} from './cssVariables';
export {
  resolveColorScheme,
  themePreferenceTitle,
  themePreferenceDescription,
  type ThemePreference,
  type ResolvedColorScheme,
} from './themePreference';
