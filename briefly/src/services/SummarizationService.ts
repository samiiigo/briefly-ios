/**
 * SummarizationService
 *
 * Abstraction layer for on-device and cloud summarization.
 *
 * On-Device (iOS 26+):  Uses the native BrieflyTranscriber Swift module which
 *                       calls Apple Foundation Models for local inference.
 *
 * On-Device (Android/fallback): Simple extractive summarization in JS.
 *
 * Cloud: Sends transcript text to multiple LLM providers (OpenRouter, OpenAI, Gemini).
 */

import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';
import { TranscriptSegment, KeyInsight, ProcessingMode } from '../types';
import { useSettingsStore } from '../store/useSettingsStore';
import { OpenRouterConfig, requireOpenRouterSharedApiKey } from '../config/openRouter';
import { OpenAIConfig } from '../config/openai';
import { GeminiConfig } from '../config/gemini';

const { BrieflyTranscriber } = NativeModules;

/** Timeout for cloud summarization API calls (ms). Prevents indefinite hangs. */
const SUMMARIZATION_TIMEOUT_MS = 30_000;

function fetchWithTimeout(
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

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function segmentsToText(segments: TranscriptSegment[]): string {
  return segments.map((s) => s.text).join(' ').trim();
}

// ─── Extractive fallback (no model needed) ────────────────────────────────────

function extractiveSummarize(text: string): { summary: string; keyInsights: KeyInsight[] } {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const summary = sentences.slice(0, 3).join('. ') + (sentences.length > 3 ? '.' : '');

  const insights = sentences
    .filter((s) => /\b(decide|action|will|should|must|key|important|summary|conclude)\b/i.test(s))
    .slice(0, 5)
    .map((s) => ({ id: generateId(), text: s }));

  if (insights.length === 0 && sentences.length > 0) {
    insights.push({ id: generateId(), text: sentences[0] });
  }

  return { summary: summary || text.slice(0, 200), keyInsights: insights };
}

// ─── On-Device ────────────────────────────────────────────────────────────────

async function summarizeOnDevice(
  segments: TranscriptSegment[]
): Promise<{ summary: string; keyInsights: KeyInsight[] }> {
  const text = segmentsToText(segments);
  logger.info('SUMMARY', 'On-device summarization requested', {
    segmentCount: segments.length,
    chars: text.length,
    platform: Platform.OS,
    hasNativeModule: !!BrieflyTranscriber?.summarize,
  });

  if (Platform.OS === 'ios' && BrieflyTranscriber?.summarize) {
    try {
      const result = await BrieflyTranscriber.summarize(text);
      logger.info('SUMMARY', 'On-device native summarization completed', {
        keyInsightCount: (result.keyInsights as string[])?.length ?? 0,
      });
      return {
        summary: result.summary,
        keyInsights: (result.keyInsights as string[]).map((t) => ({
          id: generateId(),
          text: t,
        })),
      };
    } catch (error: any) {
      logger.warn('SUMMARY', 'Native on-device summarization failed; using extractive fallback', {
        error: error?.message ?? String(error),
      });
      // Fall through to extractive
    }
  }

  logger.info('SUMMARY', 'Using extractive summarization fallback');
  return extractiveSummarize(text);
}

// ─── Cloud: route by provider ─────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a concise meeting/lecture summarizer. Given a transcript, output a JSON object with:
- "summary": a 2-4 sentence paragraph summarizing the main topic and outcome
- "keyInsights": an array of 3-6 short bullet strings capturing decisions, action items, or important points

Respond ONLY with valid JSON. No markdown fences, no extra explanation.`;

// ─── OpenRouter ────────────────────────────────────────────────────────────────

async function summarizeWithOpenRouter(
  segments: TranscriptSegment[],
  apiKey: string
): Promise<{ summary: string; keyInsights: KeyInsight[] }> {
  const text = segmentsToText(segments);
  logger.info('SUMMARY', 'OpenRouter summarization request starting', {
    endpoint: `${cloudApiEndpoint}/chat/completions`,
    chars: text.length,
  });

  const expoConfig: any = Constants.expoConfig ?? {};
  const extra: any = expoConfig.extra ?? {};
  const model: string =
    extra.openRouterModelId ??
    extra.OPENROUTER_MODEL_ID ??
    OpenRouterConfig.model;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  const referer: string | undefined =
    extra.openRouterReferer ??
    extra.OPENROUTER_REFERER;
  if (referer) {
    headers['HTTP-Referer'] = referer;
  }

  const title: string =
    extra.openRouterTitle ??
    extra.OPENROUTER_TITLE ??
    expoConfig.name ??
    'Briefly';
  headers['X-OpenRouter-Title'] = title;

  const fetchOptions: RequestInit = {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
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
    response = await fetchWithTimeout(`${OpenRouterConfig.apiBaseUrl}/chat/completions`, fetchOptions);
  } catch (e: any) {
    logger.error('SUMMARY', 'OpenRouter summarization request failed', {
      error: e?.message ?? String(e),
    });
    if (e?.name === 'AbortError' || e?.message === 'timeout') {
      throw new Error(
        'Summarization timed out. The server may be slow or unreachable. Try again or use on-device processing.'
      );
    }
    throw e;
  }

  if (!response!.ok) {
    const err = await response!.text();
    logger.error('SUMMARY', 'OpenRouter summarization response not OK', {
      status: response!.status,
      error: err,
    });
    throw new Error(`OpenRouter summarization failed: ${response!.status} ${err}`);
  }

  const data = await response!.json();
  logger.info('SUMMARY', 'OpenRouter summarization completed', {
    status: response!.status,
  });
  return parseJsonSummary(data.choices?.[0]?.message?.content ?? '{}', text);
}

async function summarizeWithSharedOpenRouter(
  segments: TranscriptSegment[]
): Promise<{ summary: string; keyInsights: KeyInsight[] }> {
  return summarizeWithOpenRouter(segments, requireOpenRouterSharedApiKey());
}

async function summarizeWithUserOpenRouter(
  segments: TranscriptSegment[]
): Promise<{ summary: string; keyInsights: KeyInsight[] }> {
  const { openrouterApiKey } = useSettingsStore.getState();
  const apiKey = openrouterApiKey.trim();
  if (!apiKey) {
    throw new Error('OpenRouter API key is not configured. Go to Settings to add your API key.');
  }
  return summarizeWithOpenRouter(segments, apiKey);
}

// ─── OpenAI ────────────────────────────────────────────────────────────────────

async function summarizeWithOpenAI(
  segments: TranscriptSegment[],
  apiKey: string
): Promise<{ summary: string; keyInsights: KeyInsight[] }> {
  const text = segmentsToText(segments);

  const expoConfig: any = Constants.expoConfig ?? {};
  const extra: any = expoConfig.extra ?? {};
  const model: string =
    extra.openaiModelId ??
    extra.OPENAI_MODEL_ID ??
    OpenAIConfig.model;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  const fetchOptions: RequestInit = {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
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
    response = await fetchWithTimeout(`${OpenAIConfig.apiBaseUrl}/chat/completions`, fetchOptions);
  } catch (e: any) {
    logger.error('SUMMARY', 'Gemini summarization request failed', {
      error: e?.message ?? String(e),
    });
    if (e?.name === 'AbortError' || e?.message === 'timeout') {
      throw new Error(
        'Summarization timed out. The server may be slow or unreachable. Try again or use on-device processing.'
      );
    }
    throw e;
  }

  if (!response!.ok) {
    const err = await response!.text();
    throw new Error(`OpenAI summarization failed: ${response!.status} ${err}`);
  }

  const data = await response!.json();
  return parseJsonSummary(data.choices?.[0]?.message?.content ?? '{}', text);
}

async function summarizeWithUserOpenAI(
  segments: TranscriptSegment[]
): Promise<{ summary: string; keyInsights: KeyInsight[] }> {
  const { openaiApiKey } = useSettingsStore.getState();
  const apiKey = openaiApiKey.trim();
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Go to Settings to add your API key.');
  }
  return summarizeWithOpenAI(segments, apiKey);
}

// ─── Gemini ────────────────────────────────────────────────────────────────────

async function summarizeWithGemini(
  segments: TranscriptSegment[],
  apiKey: string
): Promise<{ summary: string; keyInsights: KeyInsight[] }> {
  const text = segmentsToText(segments);
  logger.info('SUMMARY', 'Anthropic summarization request starting', {
    endpoint: 'https://api.anthropic.com/v1/messages',
    chars: text.length,
  });

  const expoConfig: any = Constants.expoConfig ?? {};
  const extra: any = expoConfig.extra ?? {};
  const model: string =
    extra.geminiModelId ??
    extra.GEMINI_MODEL_ID ??
    GeminiConfig.model;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  const fetchOptions: RequestInit = {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
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
    response = await fetchWithTimeout(`${GeminiConfig.apiBaseUrl}chat/completions`, fetchOptions);
  } catch (e: any) {
    logger.error('SUMMARY', 'Anthropic summarization request failed', {
      error: e?.message ?? String(e),
    });
    if (e?.name === 'AbortError' || e?.message === 'timeout') {
      throw new Error(
        'Summarization timed out. The server may be slow or unreachable. Try again or use on-device processing.'
      );
    }
    throw e;
  }

  if (!response!.ok) {
    const err = await response!.text();
    throw new Error(`Gemini summarization failed: ${response!.status} ${err}`);
  }

  const data = await response!.json();
  return parseJsonSummary(data.choices?.[0]?.message?.content ?? '{}', text);
}

async function summarizeWithUserGemini(
  segments: TranscriptSegment[]
): Promise<{ summary: string; keyInsights: KeyInsight[] }> {
  const { geminiApiKey } = useSettingsStore.getState();
  const apiKey = geminiApiKey.trim();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Go to Settings to add your API key.');
  }
  return summarizeWithGemini(segments, apiKey);
}

// ─── Router: dispatch by provider ─────────────────────────────────────────────

async function summarizeWithUserKey(
  segments: TranscriptSegment[]
): Promise<{ summary: string; keyInsights: KeyInsight[] }> {
  const { cloudProvider } = useSettingsStore.getState();
  
  if (cloudProvider === 'openai') {
    return summarizeWithUserOpenAI(segments);
  } else if (cloudProvider === 'gemini') {
    return summarizeWithUserGemini(segments);
  } else {
    // Default to OpenRouter
    return summarizeWithUserOpenRouter(segments);
  }
}

// ─── Shared JSON parser ───────────────────────────────────────────────────────

function parseJsonSummary(
  raw: string,
  fallbackText: string
): { summary: string; keyInsights: KeyInsight[] } {
  // Strip optional markdown code fences that some models add
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
  return {
    summary: parsed.summary ?? '',
    keyInsights: ((parsed.keyInsights as string[]) ?? []).map((t) => ({
      id: generateId(),
      text: t,
    })),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const SummarizationService = {
  async summarize(
    segments: TranscriptSegment[],
    mode: ProcessingMode
  ): Promise<{ summary: string; keyInsights: KeyInsight[] }> {
    if (mode === 'on-device') {
      return summarizeOnDevice(segments);
    }
    if (mode === 'cloud-shared-openrouter') {
      return summarizeWithSharedOpenRouter(segments);
    }
    if (mode === 'cloud-user-key' || mode === 'cloud') {
      return summarizeWithUserKey(segments);
    }
    return summarizeOnDevice(segments);
  },
};
