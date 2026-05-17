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

export const SYSTEM_PROMPT = `You are an expert meeting and lecture summarizer. Given a transcript, extract the key information and output a highly structured JSON object. 

Your JSON object must strictly follow this schema:
- "title": A short, catchy title summarizing the entire transcript (include 1 relevant emoji at the start).
- "overview": A concise 2-3 sentence paragraph explaining the main topic and overall outcome.
- "sections": An array of objects representing the core topics discussed. Each object must contain:
  - "heading": A short subsection title (include 1 relevant emoji).
  - "points": An array of 2-4 string elements detailing the key insights, arguments, or decisions made in this section.
- "actionItems": An array of objects capturing next steps. Each object must contain:
  - "owner": The person responsible (use "Unassigned" if not specified).
  - "task": A clear, short description of the required action.

Content & Formatting Rules:
- Use **bold** text within "overview", "points", and "task" strings to highlight names, dates, metrics, and critical decisions.
- Keep emojis tasteful and sparse (limit to titles and headings).
- Do not use markdown bullet dashes (e.g., "- ") inside the strings; the JSON array structure naturally handles the lists.
- Do not include markdown code fences (like \`\`\`json) around the output.

Respond ONLY with valid JSON. Do not include any introductory text, extra explanations, or trailing remarks.`;

interface StructuredSection {
  heading?: string;
  points?: string[];
}

interface StructuredActionItem {
  owner?: string;
  task?: string;
}

interface StructuredSummaryJson {
  title?: string;
  overview?: string;
  sections?: StructuredSection[];
  actionItems?: StructuredActionItem[];
}

function isStructuredSummaryJson(parsed: Record<string, unknown>): boolean {
  return (
    typeof parsed.overview === 'string' ||
    Array.isArray(parsed.sections) ||
    Array.isArray(parsed.actionItems)
  );
}

/** Maps the LLM structured schema to stored summary markdown + key insights. */
export function structuredSummaryToResult(
  parsed: StructuredSummaryJson
): { summary: string; keyInsights: KeyInsight[] } {
  const lines: string[] = [];

  const overview = parsed.overview?.trim();
  if (overview) {
    lines.push('## Overview', '', overview, '');
  }

  for (const section of parsed.sections ?? []) {
    const heading = section.heading?.trim();
    const points = (section.points ?? []).map((p) => p?.trim()).filter((p): p is string => !!p);
    if (!heading && points.length === 0) continue;
    if (heading) {
      lines.push(`### ${heading}`, '');
    }
    for (const point of points) {
      lines.push(`- ${point}`);
    }
    if (points.length > 0) lines.push('');
  }

  const actionInsights = (parsed.actionItems ?? [])
    .map((item) => {
      const task = item.task?.trim();
      if (!task) return null;
      const owner = item.owner?.trim() || 'Unassigned';
      return { id: generateId(), text: `**${owner}**: ${task}` };
    })
    .filter((item): item is KeyInsight => item !== null);

  let keyInsights = actionInsights;
  if (keyInsights.length === 0) {
    const sectionPoints = (parsed.sections ?? [])
      .flatMap((section) => (section.points ?? []).map((p) => p?.trim()).filter((p): p is string => !!p))
      .slice(0, 6);
    keyInsights = sectionPoints.map((text) => ({ id: generateId(), text }));
  }

  let summary = lines.join('\n').trim();
  if (!summary) {
    const title = parsed.title?.trim();
    if (title) {
      summary = `## Overview\n\n${title}`;
    } else if (keyInsights.length > 0) {
      summary = '## Overview\n\n_Key points and action items are listed below._';
    }
  }

  return { summary, keyInsights };
}

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
  if (isStructuredSummaryJson(parsed)) {
    const structured = structuredSummaryToResult(parsed as StructuredSummaryJson);
    logger.info('SUMMARY', 'Structured JSON summary parsed successfully', {
      hasOverview: !!parsed.overview,
      sectionCount: Array.isArray(parsed.sections) ? parsed.sections.length : 0,
      actionItemCount: Array.isArray(parsed.actionItems) ? parsed.actionItems.length : 0,
    });
    return normalizeSummarizationResult(structured, fallbackText);
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
