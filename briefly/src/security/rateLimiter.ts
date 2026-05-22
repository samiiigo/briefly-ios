import {
  CLIENT_RATE_LIMIT_RETRY_AFTER_SEC,
  EndpointRateLimits,
  PUBLIC_ENDPOINT_RATE_LIMITS,
  RateLimitRule,
} from './limits';
import { RateLimitError } from './RateLimitError';
import { getDeviceRateLimitId } from './deviceIdentity';

type BucketKey = string;

interface Timestamps {
  readonly times: number[];
}

const buckets = new Map<BucketKey, Timestamps>();

function pruneWindow(times: number[], now: number, windowMs: number): number[] {
  const cutoff = now - windowMs;
  let start = 0;
  while (start < times.length && times[start] <= cutoff) {
    start += 1;
  }
  return start === 0 ? times : times.slice(start);
}

function bucketKey(scope: 'ip' | 'user', host: string, id: string): BucketKey {
  return `${scope}:${host}:${id}`;
}

function checkRule(
  scope: 'ip' | 'user',
  host: string,
  id: string,
  rule: RateLimitRule,
  now: number
): void {
  const key = bucketKey(scope, host, id);
  const existing = buckets.get(key)?.times ?? [];
  const pruned = pruneWindow(existing, now, rule.windowMs);

  if (pruned.length >= rule.maxRequests) {
    throw new RateLimitError(
      `Rate limit exceeded for ${host} (${scope} bucket). Try again in ${CLIENT_RATE_LIMIT_RETRY_AFTER_SEC} seconds.`,
      CLIENT_RATE_LIMIT_RETRY_AFTER_SEC
    );
  }

  buckets.set(key, { times: [...pruned, now] });
}

function hostFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function resolvePublicEndpointLimits(url: string): EndpointRateLimits | null {
  const host = hostFromUrl(url);
  if (!host) return null;
  return PUBLIC_ENDPOINT_RATE_LIMITS[host] ?? null;
}

/**
 * Enforces IP (device) + user sliding-window limits before outbound calls.
 * No-op for URLs that are not registered public API hosts.
 */
export async function assertPublicEndpointRateLimit(url: string): Promise<void> {
  const limits = resolvePublicEndpointLimits(url);
  if (!limits) return;

  const host = hostFromUrl(url);
  if (!host) return;

  const now = Date.now();
  const deviceId = await getDeviceRateLimitId();
  const userId = deviceId;

  checkRule('ip', host, deviceId, limits.ip, now);
  checkRule('user', host, userId, limits.user, now);
}

/** Clears all in-memory buckets (tests only). */
export function resetRateLimiterState(): void {
  buckets.clear();
}
