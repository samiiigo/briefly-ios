/**
 * Shared utilities for summarization providers (SRP).
 *
 * Extracted from the monolithic SummarizationService so each helper has a
 * single reason to change: ID generation, text conversion, JSON parsing,
 * and the extractive fallback are independent concerns.
 */

import { TranscriptSegment, KeyInsight } from '@/types';
import { logger } from '@/utils/logger';
import { SummarizationResult } from './summarizationProvider';

/** Timeout for cloud summarization API calls (ms). */
export const SUMMARIZATION_TIMEOUT_MS = 30_000;

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function segmentsToText(segments: TranscriptSegment[]): string {
  return segments.map((s) => s.text).join(' ').trim();
}

export const SYSTEM_PROMPT = `You are a concise meeting/lecture summarizer. Given a transcript, output a JSON object with:
- "summary": a Markdown string for the app summary screen. Structure it clearly:
  - Start with "## Summary" then 2-4 sentences on the main topic and outcome
  - Optionally add "## Key points" with "- " bullets for the most important takeaways
  - Use **bold** for names, dates, decisions, and action owners
  - Use plain Markdown only (no code fences around the summary)
- "keyInsights": an array of 3-6 short bullet strings capturing decisions, action items, or important points (plain text, no Markdown)

Respond ONLY with valid JSON. No markdown fences around the JSON, no extra explanation.`;

/**
 * Simple extractive summarization — no model needed.
 * Used as a fallback when cloud/on-device inference is unavailable.
 */
export function extractiveSummarize(
  text: string
): { summary: string; keyInsights: KeyInsight[] } {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const overview =
    sentences.slice(0, 3).join('. ') + (sentences.length > 3 ? '.' : '');
  const summary = overview
    ? `## Summary\n\n${overview}`
    : `## Summary\n\n${text.slice(0, 200)}`;

  const insights = sentences
    .filter((s) => /\b(decide|action|will|should|must|key|important|summary|conclude)\b/i.test(s))
    .slice(0, 5)
    .map((s) => ({ id: generateId(), text: s }));

  if (insights.length === 0 && sentences.length > 0) {
    insights.push({ id: generateId(), text: sentences[0] });
  }

  return { summary, keyInsights: insights };
}

/**
 * Parse a JSON summary response from an LLM.
 * Falls back to extractive summarization if the response is malformed.
 */
export function parseJsonSummary(
  raw: string,
  fallbackText: string
): { summary: string; keyInsights: KeyInsight[] } {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  let parsed: any = {};
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    logger.warn('SUMMARY', 'Model response was not valid JSON; using extractive fallback');
    return extractiveSummarize(fallbackText);
  }
  logger.info('SUMMARY', 'JSON summary parsed successfully', {
    hasSummary: typeof parsed.summary === 'string' && parsed.summary.length > 0,
    keyInsightCount: Array.isArray(parsed.keyInsights) ? parsed.keyInsights.length : 0,
  });
  return normalizeSummarizationResult(
    {
      summary: parsed.summary ?? '',
      keyInsights: ((parsed.keyInsights as string[]) ?? []).map((t) => ({
        id: generateId(),
        text: t,
      })),
    },
    fallbackText
  );
}

/**
 * Normalizes provider results to keep a stable substitution contract (LSP).
 * Every provider must return a non-empty summary and normalized insights.
 */
export function normalizeSummarizationResult(
  result: Partial<SummarizationResult>,
  fallbackText: string
): SummarizationResult {
  const normalizedSummary = (result.summary ?? '').trim();
  const normalizedInsights = (result.keyInsights ?? [])
    .map((insight) => insight?.text?.trim() ?? '')
    .filter((text) => text.length > 0)
    .map((text) => ({ id: generateId(), text }));

  if (normalizedSummary.length > 0) {
    return {
      summary: normalizedSummary,
      keyInsights: normalizedInsights,
    };
  }

  logger.warn('SUMMARY', 'Provider returned empty summary; using extractive fallback');
  return extractiveSummarize(fallbackText);
}

/**
 * fetch() wrapper with a timeout guard.
 */
export function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = SUMMARIZATION_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const fetchPromise = fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timeoutId)
  );
  let fallbackTimeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    fallbackTimeoutId = setTimeout(() => reject(new Error('timeout')), timeoutMs);
  });
  return Promise.race([fetchPromise, timeoutPromise]).finally(() => clearTimeout(fallbackTimeoutId!));
}
