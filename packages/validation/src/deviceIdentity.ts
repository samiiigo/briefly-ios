const DEVICE_ID_KEY = '@briefly/security/device-id';

export type DeviceIdentityStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

let storageAdapter: DeviceIdentityStorage | null = null;
let cachedDeviceId: string | null = null;
/** Test-only override (Node test runner may have no persistent storage). */
let testDeviceIdOverride: string | null = null;
/** In-memory fallback when no adapter is configured. */
let memoryDeviceId: string | null = null;

/** Inject platform storage (AsyncStorage on mobile, localStorage wrapper on web). */
export function configureDeviceIdentityStorage(adapter: DeviceIdentityStorage): void {
  storageAdapter = adapter;
}

/**
 * Stable per-install identifier used as the "IP" bucket for client rate limiting.
 * Not authentication — only abuse prevention on outbound API calls.
 */
export async function getDeviceRateLimitId(): Promise<string> {
  if (testDeviceIdOverride) return testDeviceIdOverride;
  if (cachedDeviceId) return cachedDeviceId;

  if (storageAdapter) {
    const existing = await storageAdapter.getItem(DEVICE_ID_KEY);
    if (existing?.trim()) {
      cachedDeviceId = existing.trim();
      return cachedDeviceId;
    }
    const created = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    await storageAdapter.setItem(DEVICE_ID_KEY, created);
    cachedDeviceId = created;
    return cachedDeviceId;
  }

  if (!memoryDeviceId) {
    memoryDeviceId = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
  cachedDeviceId = memoryDeviceId;
  return cachedDeviceId;
}

/** Clears in-memory cache (tests only). */
export function resetDeviceRateLimitIdCache(): void {
  cachedDeviceId = null;
  testDeviceIdOverride = null;
  memoryDeviceId = null;
}

/** Pins device id for unit tests (tests only). */
export function setDeviceRateLimitIdForTests(id: string): void {
  testDeviceIdOverride = id;
}
