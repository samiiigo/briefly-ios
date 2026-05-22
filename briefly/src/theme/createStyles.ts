import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { useThemedColors } from './ThemeProvider';
import type { ColorPalette } from './colorPalettes';
type NamedStyles<T> = {
  [P in keyof T]: ViewStyle | TextStyle | ImageStyle;
};
export function useCreateStyles<T extends NamedStyles<T>>(
  factory: (colors: ColorPalette) => T,
): T {
  const colors = useThemedColors();
  return useMemo(() => StyleSheet.create(factory(colors)), [colors, factory]);
}
