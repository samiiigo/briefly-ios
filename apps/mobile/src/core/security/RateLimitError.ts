/**
 * Thrown when the client-side rate limiter blocks an outbound request.
 * Mirrors HTTP 429 semantics for consistent upstream handling.
 */
export class RateLimitError extends Error {
  readonly status = 429;
  readonly retryAfterSec: number;
  constructor(message: string, retryAfterSec: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfterSec = retryAfterSec;
  }
}
