import AsyncStorage from '@react-native-async-storage/async-storage';
const DEVICE_ID_KEY = '@briefly/security/device-id';
let cachedDeviceId: string | null = null;
/** Test-only override (Node test runner has no AsyncStorage window). */
let testDeviceIdOverride: string | null = null;
/**
 * Stable per-install identifier used as the "IP" bucket for client rate limiting.
 * Not authentication — only abuse prevention on outbound API calls.
 */
export async function getDeviceRateLimitId(): Promise<string> {
  if (testDeviceIdOverride) return testDeviceIdOverride;
  if (cachedDeviceId) return cachedDeviceId;
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing?.trim()) {
    cachedDeviceId = existing.trim();
    return cachedDeviceId;
  }
  const created = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, created);
  cachedDeviceId = created;
  return created;
}
/** Clears in-memory cache (tests only). */
export function resetDeviceRateLimitIdCache(): void {
  cachedDeviceId = null;
  testDeviceIdOverride = null;
}
/** Pins device id for unit tests (tests only). */
export function setDeviceRateLimitIdForTests(id: string): void {
  testDeviceIdOverride = id;
}
