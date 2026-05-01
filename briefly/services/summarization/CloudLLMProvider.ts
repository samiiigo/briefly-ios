/**
 * CloudLLMProvider — base class for OpenAI-compatible chat completion APIs (OCP)
 *
 * Encapsulates the shared HTTP request/response logic. Concrete subclasses
 * only supply their endpoint URL, model name, and request headers — so new
 * LLM providers can be added by extending this class without modifying it.
 *
 * This also satisfies DIP: callers depend on the SummarizationProvider
 * interface, not on any concrete cloud provider.
 */

import { TranscriptSegment } from '../../types';
import { SummarizationProvider, SummarizationResult } from './SummarizationProvider';
import {
  segmentsToText,
  fetchWithTimeout,
  parseJsonSummary,
  SYSTEM_PROMPT,
} from './summarizationUtils';
import { logger } from '../../lib/logger';

export interface CloudLLMConfig {
  /** Full URL for the chat completions endpoint. */
  endpoint: string;
  /** Model identifier to send in the request body. */
  model: string;
  /** HTTP headers (must include Authorization). */
  headers: Record<string, string>;
}

/**
 * Abstract base for any provider that speaks the OpenAI chat-completion protocol.
 * Subclasses implement `resolveConfig()` to supply credentials and endpoint.
 */
export abstract class CloudLLMProvider implements SummarizationProvider {
  abstract readonly name: string;

  /** Resolve provider-specific config (endpoint, model, headers). */
  protected abstract resolveConfig(): CloudLLMConfig;

  async summarize(segments: TranscriptSegment[]): Promise<SummarizationResult> {
    const text = segmentsToText(segments);
    const config = this.resolveConfig();

    logger.info('SUMMARY', `${this.name} summarization request starting`, {
      endpoint: config.endpoint,
      chars: text.length,
    });

    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...config.headers },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Transcript:\n${text}` },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    };

    let response: Response;
    try {
      response = await fetchWithTimeout(config.endpoint, fetchOptions);
    } catch (e: any) {
      logger.error('SUMMARY', `${this.name} summarization request failed`, {
        error: e?.message ?? String(e),
      });
      if (e?.name === 'AbortError' || e?.message === 'timeout') {
        throw new Error(
          'Summarization timed out. The server may be slow or unreachable. Try again or use on-device processing.'
        );
      }
      throw e;
    }

    if (!response.ok) {
      const err = await response.text();
      logger.error('SUMMARY', `${this.name} summarization response not OK`, {
        status: response.status,
        error: err,
      });
      throw new Error(`${this.name} summarization failed: ${response.status} ${err}`);
    }

    const data = await response.json();
    logger.info('SUMMARY', `${this.name} summarization completed`, {
      status: response.status,
    });
    return parseJsonSummary(data.choices?.[0]?.message?.content ?? '{}', text);
  }
}
