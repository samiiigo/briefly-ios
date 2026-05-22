import { CLIENT_RATE_LIMIT_RETRY_AFTER_SEC } from './limits';
import { RateLimitError } from './RateLimitError';
import { assertPublicEndpointRateLimit } from './rateLimiter';
function parseRetryAfterSec(response: Response): number | undefined {
  const header = response.headers.get('Retry-After');
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds);
  const dateMs = Date.parse(header);
  if (Number.isFinite(dateMs)) {
    const delta = Math.ceil((dateMs - Date.now()) / 1000);
    return delta > 0 ? delta : undefined;
  }
  return undefined;
}
/**
 * Outbound fetch for third-party APIs: applies client rate limits, surfaces 429s clearly.
 * Non-public URLs pass through unchanged (local file URLs, etc.).
 */
export async function secureFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : (input as Request).url;
  await assertPublicEndpointRateLimit(url);
  const response = await fetch(input, init);
  if (response.status === 429) {
    const retryAfterSec =
      parseRetryAfterSec(response) ?? CLIENT_RATE_LIMIT_RETRY_AFTER_SEC;
    const bodySnippet = await response.text().catch(() => '');
    throw new RateLimitError(
      bodySnippet.trim()
        ? `Upstream rate limit (429): ${bodySnippet.slice(0, 200)}`
        : 'Upstream rate limit (429). Please try again later.',
      retryAfterSec
    );
  }
  return response;
}
