import { Linking, Platform } from 'react-native';
import { requestRecordingPermissionsAsync, getRecordingPermissionsAsync } from 'expo-audio';

export type MicrophonePermissionStatus = 'granted' | 'denied' | 'undetermined';

export async function getMicrophonePermissionStatus(): Promise<MicrophonePermissionStatus> {
  try {
    const { granted, canAskAgain } = await getRecordingPermissionsAsync();
    if (granted) return 'granted';
    if (canAskAgain) return 'undetermined';
    return 'denied';
  } catch {
    return 'undetermined';
  }
}

export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const { granted } = await requestRecordingPermissionsAsync();
    return granted;
  } catch {
    return false;
  }
}

/**
 * Ensures microphone access before starting capture. Throws with a clear message if denied.
 */
export async function ensureMicrophonePermission(): Promise<void> {
  const status = await getMicrophonePermissionStatus();
  if (status === 'granted') return;

  const granted = await requestMicrophonePermission();
  if (granted) return;

  throw new Error(
    'Microphone access is required to record. Enable it in Settings and try again.',
  );
}

export function openAppSettings(): void {
  void Linking.openSettings().catch(() => {
    if (Platform.OS === 'ios') {
      void Linking.openURL('app-settings:');
    }
  });
}
