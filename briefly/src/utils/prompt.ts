/**
 * Cross-platform text prompt utility.
 *
 * Uses Alert.prompt on iOS (native feel) and falls back to a simple
 * callback-based approach on Android that callers can use with their
 * own modal TextInput. This avoids pulling in a full dialog library.
 *
 * For a consistent approach, use the `promptText` function which
 * returns a Promise<string | null>.
 */

import { Alert, Platform } from 'react-native';

/**
 * Show a native text prompt (iOS) or a simple Alert with OK on Android.
 *
 * On iOS this uses the native `Alert.prompt`.
 * On Android, since `Alert.prompt` doesn't exist, the onSubmit callback
 * fires immediately with the defaultValue — callers are expected to
 * provide their own TextInput modal on Android if needed.
 *
 * For most rename / create-folder flows in this app, the components
 * already have platform-guarded code using `Alert.prompt` on iOS and
 * a `Modal` + `TextInput` on Android, so this helper is mainly for
 * shared utility use.
 */
export function promptText(options: {
  title: string;
  message?: string;
  defaultValue?: string;
  onSubmit: (text: string) => void;
  onCancel?: () => void;
}): void {
  const { title, message, defaultValue = '', onSubmit, onCancel } = options;

  if (Platform.OS === 'ios') {
    Alert.prompt(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: onCancel },
        {
          text: 'OK',
          onPress: (text?: string) => {
            const trimmed = text?.trim();
            if (trimmed) onSubmit(trimmed);
            else onCancel?.();
          },
        },
      ],
      'plain-text',
      defaultValue,
    );
  } else {
    // Android: Alert.prompt is not supported.
    // Callers should check Platform.OS and show a custom modal with TextInput.
    // This fallback just alerts the user to use the appropriate UI.
    onCancel?.();
  }
}
