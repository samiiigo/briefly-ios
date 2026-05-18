/**
 * Platform detection utilities for cross-platform support.
 *
 * Provides type-safe helpers for branching on the current OS,
 * wrapping React Native's `Platform` module.
 */

import { Platform } from 'react-native';

/** True when running on iOS (iPhone, iPad, or Simulator). */
export const isIOS = Platform.OS === 'ios';

/** True when running on Android (phone, tablet, or emulator). */
export const isAndroid = Platform.OS === 'android';

/** True when running in a web browser (Expo Web). */
export const isWeb = Platform.OS === 'web';

/**
 * A type-safe alternative to `Platform.select` with required keys.
 *
 * ```ts
 * const radius = platformSelect({ ios: 16, android: 12 });
 * ```
 */
export function platformSelect<T>(options: {
  ios: T;
  android: T;
  default?: T;
}): T {
  return Platform.select({
    ios: options.ios,
    android: options.android,
    default: options.default ?? options.android,
  }) as T;
}
