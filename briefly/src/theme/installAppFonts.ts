import { Platform, Text, TextInput } from 'react-native';
import { Fonts } from './fonts';

/**
 * Sets the platform default font family so inline Text styles inherit the app font.
 * iOS: SF Pro Text, Android: Roboto.
 * Per-style `fontFamily` (e.g. SF Pro Display for large titles) still overrides.
 */
export function installAppFonts() {
  if (Platform.OS === 'web' || !Fonts.text) return;

  const base = { fontFamily: Fonts.text };

  type WithDefaults = { defaultProps?: { style?: object } };
  const TextWithDefaults = Text as typeof Text & WithDefaults;
  const TextInputWithDefaults = TextInput as typeof TextInput & WithDefaults;

  TextWithDefaults.defaultProps = { ...TextWithDefaults.defaultProps, style: base };
  TextInputWithDefaults.defaultProps = {
    ...TextInputWithDefaults.defaultProps,
    style: base,
  };
}
