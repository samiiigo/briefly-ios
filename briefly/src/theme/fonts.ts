import { Platform, TextStyle } from 'react-native';
/** Apple HIG: Display for larger type, Text for body and smaller labels. */
export const SF_DISPLAY_MIN_SIZE = 20;
export const Fonts = {
  text: Platform.select({
    ios: 'SF Pro Text',
    android: 'Roboto',
    default: undefined,
  }),
  display: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto',
    default: undefined,
  }),
} as const;
export function fontFamilyForSize(fontSize: number): string | undefined {
  if (Platform.OS === 'ios') {
    return fontSize >= SF_DISPLAY_MIN_SIZE ? Fonts.display : Fonts.text;
  }
  // Android and other platforms use the text family (Roboto / system default)
  return Fonts.text;
}
/** Applies the correct SF Pro variant for the style's font size. */
export function withAppFont(style: TextStyle): TextStyle {
  const fontSize = typeof style.fontSize === 'number' ? style.fontSize : 17;
  const fontFamily = fontFamilyForSize(fontSize);
  if (!fontFamily) return style;
  return { ...style, fontFamily };
}
export function appFont(
  fontSize: number,
  fontWeight: TextStyle['fontWeight'],
  color: string
): TextStyle {
  return withAppFont({ fontSize, fontWeight, color });
}
/** Serif headings on summary screens (Georgia on iOS, system serif elsewhere). */
export function withSerifFont(style: TextStyle): TextStyle {
  const fontFamily = Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: undefined,
  });
  if (!fontFamily) return style;
  return { ...style, fontFamily };
}
