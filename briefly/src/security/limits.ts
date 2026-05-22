/**
 * Default rate-limit windows for third-party "public" API hosts (OWASP API4:2023).
 *
 * Mobile apps have no server-side IP; we use a stable device identifier as the
 * IP bucket surrogate plus a per-install user bucket for BYOK traffic.
 */

export interface RateLimitRule {
  /** Sliding window length in milliseconds. */
  windowMs: number;
  /** Maximum requests allowed in the window. */
  maxRequests: number;
}

export interface EndpointRateLimits {
  /** Device / install bucket (surrogate for IP on client). */
  ip: RateLimitRule;
  /** Per-install user bucket (shared keys + BYOK share this scope). */
  user: RateLimitRule;
}

/** Hostname → limits. Unknown hosts are not rate-limited here (not public APIs). */
export const PUBLIC_ENDPOINT_RATE_LIMITS: Record<string, EndpointRateLimits> = {
  'api.assemblyai.com': {
    ip: { windowMs: 60_000, maxRequests: 60 },
    user: { windowMs: 60_000, maxRequests: 30 },
  },
  'openrouter.ai': {
    ip: { windowMs: 60_000, maxRequests: 40 },
    user: { windowMs: 60_000, maxRequests: 20 },
  },
  'api.openai.com': {
    ip: { windowMs: 60_000, maxRequests: 40 },
    user: { windowMs: 60_000, maxRequests: 20 },
  },
  'generativelanguage.googleapis.com': {
    ip: { windowMs: 60_000, maxRequests: 40 },
    user: { windowMs: 60_000, maxRequests: 20 },
  },
  'api.anthropic.com': {
    ip: { windowMs: 60_000, maxRequests: 40 },
    user: { windowMs: 60_000, maxRequests: 20 },
  },
  'models.inference.ai.azure.com': {
    ip: { windowMs: 60_000, maxRequests: 40 },
    user: { windowMs: 60_000, maxRequests: 20 },
  },
};

/** Default Retry-After hint (seconds) when our client limiter fires. */
export const CLIENT_RATE_LIMIT_RETRY_AFTER_SEC = 30;
