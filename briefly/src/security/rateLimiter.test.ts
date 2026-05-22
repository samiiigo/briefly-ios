import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import { assertPublicEndpointRateLimit, resetRateLimiterState } from './rateLimiter';
import { resetDeviceRateLimitIdCache, setDeviceRateLimitIdForTests } from './deviceIdentity';
import { RateLimitError } from './RateLimitError';
import { PUBLIC_ENDPOINT_RATE_LIMITS } from './limits';

describe('rateLimiter', () => {
  beforeEach(() => {
    resetRateLimiterState();
    resetDeviceRateLimitIdCache();
    setDeviceRateLimitIdForTests('test-device');
  });

  it('allows requests under both device and user limits', async () => {
    const url = 'https://api.assemblyai.com/v2/transcript';
    const limits = PUBLIC_ENDPOINT_RATE_LIMITS['api.assemblyai.com'];
    const max = Math.min(limits.ip.maxRequests, limits.user.maxRequests);
    for (let i = 0; i < max; i += 1) {
      await assertPublicEndpointRateLimit(url);
    }
    assert.equal(max > 0, true);
  });

  it('throws RateLimitError with 429 semantics when exceeded', async () => {
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const limits = PUBLIC_ENDPOINT_RATE_LIMITS['openrouter.ai'];
    const max = Math.min(limits.ip.maxRequests, limits.user.maxRequests);
    for (let i = 0; i < max; i += 1) {
      await assertPublicEndpointRateLimit(url);
    }
    await assert.rejects(
      () => assertPublicEndpointRateLimit(url),
      (error: unknown) => {
        assert.ok(error instanceof RateLimitError);
        assert.equal(error.status, 429);
        assert.ok(error.retryAfterSec > 0);
        return true;
      }
    );
  });

  it('ignores non-public hosts', async () => {
    await assertPublicEndpointRateLimit('file:///local/recording.m4a');
  });
});
