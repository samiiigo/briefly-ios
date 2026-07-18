import { darkColors, lightColors, type ColorPalette } from './colorPalettes';
import { BorderRadius, Spacing } from './spacing';

function camelToKebab(key: string): string {
  return key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

/** Maps a color palette to CSS custom property names (`--color-*`). */
export function colorPaletteToCssVariables(palette: ColorPalette): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(palette)) {
    vars[`--color-${camelToKebab(key)}`] = value;
  }
  return vars;
}

/** Maps spacing and border-radius tokens to CSS custom properties. */
export function spacingToCssVariables(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(Spacing)) {
    vars[`--spacing-${camelToKebab(key)}`] = `${value}px`;
  }
  for (const [key, value] of Object.entries(BorderRadius)) {
    vars[`--radius-${camelToKebab(key)}`] = `${value}px`;
  }
  return vars;
}

export const lightThemeCssVariables: Record<string, string> = {
  ...colorPaletteToCssVariables(lightColors),
  ...spacingToCssVariables(),
};

export const darkThemeCssVariables: Record<string, string> = {
  ...colorPaletteToCssVariables(darkColors),
  ...spacingToCssVariables(),
};

function variablesBlock(selector: string, vars: Record<string, string>): string {
  const lines = Object.entries(vars)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');
  return `${selector} {\n${lines}\n}`;
}

/** Generates a CSS block with light/dark theme custom properties. */
export function generateThemeCss(): string {
  return [
    variablesBlock(':root, [data-theme="light"]', lightThemeCssVariables),
    variablesBlock('[data-theme="dark"]', darkThemeCssVariables),
  ].join('\n\n');
}
