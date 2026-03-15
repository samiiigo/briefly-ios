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
 * Cloud: Sends transcript text to OpenAI chat completions (or compatible
 *        endpoint) with zero-data-retention posture.
 */

import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';
import { TranscriptSegment, KeyInsight } from '../types';
import { useSettingsStore } from '../store/useSettingsStore';
import { logger } from '../utils/logger';

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

async function summarizeCloud(
  segments: TranscriptSegment[]
): Promise<{ summary: string; keyInsights: KeyInsight[] }> {
  const { cloudApiProvider } = useSettingsStore.getState();
  logger.info('SUMMARY', 'Cloud summarization requested', {
    provider: cloudApiProvider ?? 'openai(default)',
    segmentCount: segments.length,
  });
  if (cloudApiProvider === 'gemini') {
    return summarizeWithGemini(segments);
  }
  if (cloudApiProvider === 'anthropic') {
    return summarizeWithAnthropic(segments);
  }
  if (cloudApiProvider === 'openrouter') {
    return summarizeWithOpenRouter(segments);
  }
  // openai and github both use the OpenAI-compatible chat completions endpoint
  return summarizeWithOpenAI(segments);
}

// ─── OpenAI ───────────────────────────────────────────────────────────────────

async function summarizeWithOpenAI(
  segments: TranscriptSegment[]
): Promise<{ summary: string; keyInsights: KeyInsight[] }> {
  const { cloudApiKey, cloudApiEndpoint } = useSettingsStore.getState();

  if (!cloudApiKey) {
    throw new Error('Cloud API key is not configured. Go to Settings to add your API key.');
  }

  const text = segmentsToText(segments);
  logger.info('SUMMARY', 'OpenAI-compatible summarization request starting', {
    endpoint: `${cloudApiEndpoint}/chat/completions`,
    chars: text.length,
  });

  const fetchOptions: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cloudApiKey}`,
      'OpenAI-No-Training': '1',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
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
    response = await fetchWithTimeout(`${cloudApiEndpoint}/chat/completions`, fetchOptions);
  } catch (e: any) {
    logger.error('SUMMARY', 'OpenAI-compatible summarization request failed', {
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
    logger.error('SUMMARY', 'OpenAI-compatible summarization response not OK', {
      status: response!.status,
      error: err,
    });
    throw new Error(`OpenAI summarization failed: ${response!.status} ${err}`);
  }

  const data = await response!.json();
  logger.info('SUMMARY', 'OpenAI-compatible summarization completed', {
    status: response!.status,
  });
  return parseJsonSummary(data.choices?.[0]?.message?.content ?? '{}', segmentsToText(segments));
}

// ─── OpenRouter ────────────────────────────────────────────────────────────────

async function summarizeWithOpenRouter(
  segments: TranscriptSegment[]
): Promise<{ summary: string; keyInsights: KeyInsight[] }> {
  const { cloudApiKey, cloudApiEndpoint } = useSettingsStore.getState();

  if (!cloudApiKey) {
    throw new Error('Cloud API key is not configured. Go to Settings to add your API key.');
  }

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
    'openai/gpt-4.1-mini';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${cloudApiKey}`,
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
    response = await fetchWithTimeout(`${cloudApiEndpoint}/chat/completions`, fetchOptions);
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

// ─── Gemini ───────────────────────────────────────────────────────────────────

async function summarizeWithGemini(
  segments: TranscriptSegment[]
): Promise<{ summary: string; keyInsights: KeyInsight[] }> {
  const { cloudApiKey } = useSettingsStore.getState();

  if (!cloudApiKey) {
    throw new Error('Gemini API key is not configured. Go to Settings to add your API key.');
  }

  const text = segmentsToText(segments);
  logger.info('SUMMARY', 'Gemini summarization request starting', {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
    chars: text.length,
  });
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent` +
    `?key=${cloudApiKey}`;

  const fetchOptions: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: `Transcript:\n${text}` }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 800 },
    }),
  };
  let response: Response;
  try {
    response = await fetchWithTimeout(url, fetchOptions);
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
    logger.error('SUMMARY', 'Gemini summarization response not OK', {
      status: response!.status,
      error: err,
    });
    throw new Error(`Gemini summarization failed: ${response!.status} ${err}`);
  }

  const data = await response!.json();
  logger.info('SUMMARY', 'Gemini summarization completed', {
    status: response!.status,
  });
  const content: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  return parseJsonSummary(content, text);
}

// ─── Anthropic Claude ─────────────────────────────────────────────────────────

async function summarizeWithAnthropic(
  segments: TranscriptSegment[]
): Promise<{ summary: string; keyInsights: KeyInsight[] }> {
  const { cloudApiKey } = useSettingsStore.getState();

  if (!cloudApiKey) {
    throw new Error('Anthropic API key is not configured. Go to Settings to add your API key.');
  }

  const text = segmentsToText(segments);
  logger.info('SUMMARY', 'Anthropic summarization request starting', {
    endpoint: 'https://api.anthropic.com/v1/messages',
    chars: text.length,
  });

  const fetchOptions: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cloudApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Transcript:\n${text}` }],
    }),
  };
  let response: Response;
  try {
    response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', fetchOptions);
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
    logger.error('SUMMARY', 'Anthropic summarization response not OK', {
      status: response!.status,
      error: err,
    });
    throw new Error(`Anthropic summarization failed: ${response!.status} ${err}`);
  }

  const data = await response!.json();
  logger.info('SUMMARY', 'Anthropic summarization completed', {
    status: response!.status,
  });
  const content: string = data.content?.[0]?.text ?? '{}';
  return parseJsonSummary(content, text);
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
    mode: 'on-device' | 'cloud'
  ): Promise<{ summary: string; keyInsights: KeyInsight[] }> {
    logger.info('SUMMARY', 'Summarization entrypoint invoked', {
      mode,
      segmentCount: segments.length,
    });
    if (mode === 'cloud') {
      return summarizeCloud(segments);
    }
    return summarizeOnDevice(segments);
  },
};
