import { createAudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
import { normalizeFileUri } from '@/utils/fileSystem/normalizeFileUri';
import { logger } from '@/utils/logging/logger';
const PROBE_TIMEOUT_MS = 8_000;
/**
 * Reads duration from an on-disk audio file via expo-audio. Returns 0 when unknown.
 */
export async function probeAudioDurationSec(uri: string): Promise<number> {
  const trimmed = normalizeFileUri(uri);
  if (!trimmed) return 0;
  const player = createAudioPlayer(trimmed, {
    downloadFirst: Platform.OS === 'ios' || Platform.OS === 'android',
    updateInterval: 100,
  });
  return new Promise((resolve) => {
    let settled = false;
    const finish = (duration: number) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      try {
        listener.remove();
      } catch {
        // ignore
      }
      try {
        player.remove();
      } catch {
        // ignore
      }
      resolve(Math.max(0, duration));
    };
    const timeoutId = setTimeout(() => {
      logger.warn('AUDIO', 'Audio duration probe timed out', { uri: trimmed });
      finish(0);
    }, PROBE_TIMEOUT_MS);
    const listener = player.addListener('playbackStatusUpdate', (status) => {
      if (status.isLoaded && status.duration > 0) {
        finish(status.duration);
      }
    });
  });
}
