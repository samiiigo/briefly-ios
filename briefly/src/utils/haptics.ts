/**
 * Cross-platform haptic feedback wrapper.
 *
 * Guards against unsupported platforms (web) where Haptics APIs
 * are not available. Safe to call on iOS and Android.
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Trigger impact haptic feedback. No-op on web. */
export const triggerHaptic = (
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light,
): void => {
  if (Platform.OS !== 'web') {
    void Haptics.impactAsync(style);
  }
};

/** Trigger notification haptic feedback. No-op on web. */
export const triggerNotificationHaptic = (
  type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success,
): void => {
  if (Platform.OS !== 'web') {
    void Haptics.notificationAsync(type);
  }
};

/** Trigger selection haptic feedback. No-op on web. */
export const triggerSelectionHaptic = (): void => {
  if (Platform.OS !== 'web') {
    void Haptics.selectionAsync();
  }
};
