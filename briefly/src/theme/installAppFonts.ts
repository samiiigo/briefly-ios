import { Platform, Text, TextInput } from 'react-native';
import { Fonts } from './fonts';

/**
 * Sets SF Pro Text as the default on iOS so inline Text styles inherit the app font.
 * Per-style `fontFamily` (e.g. SF Pro Display for large titles) still overrides.
 */
export function installAppFonts() {
  if (Platform.OS !== 'ios' || !Fonts.text) return;

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
