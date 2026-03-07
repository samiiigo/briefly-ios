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
import { TranscriptSegment, KeyInsight } from '../types';
import { useSettingsStore } from '../store/useSettingsStore';

const { BrieflyTranscriber } = NativeModules;

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

  if (Platform.OS === 'ios' && BrieflyTranscriber?.summarize) {
    try {
      const result = await BrieflyTranscriber.summarize(text);
      return {
        summary: result.summary,
        keyInsights: (result.keyInsights as string[]).map((t) => ({
          id: generateId(),
          text: t,
        })),
      };
    } catch {
      // Fall through to extractive
    }
  }

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
  if (cloudApiProvider === 'gemini') {
    return summarizeWithGemini(segments);
  }
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

  const response = await fetch(`${cloudApiEndpoint}/chat/completions`, {
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
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI summarization failed: ${response.status} ${err}`);
  }

  const data = await response.json();
  return parseJsonSummary(data.choices?.[0]?.message?.content ?? '{}', segmentsToText(segments));
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
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent` +
    `?key=${cloudApiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        { role: 'user', parts: [{ text: `Transcript:\n${text}` }] },
      ],
      generationConfig: { temperature: 0.3, maxOutputTokens: 800 },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini summarization failed: ${response.status} ${err}`);
  }

  const data = await response.json();
  const content: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
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
    return extractiveSummarize(fallbackText);
  }
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
    if (mode === 'cloud') {
      return summarizeCloud(segments);
    }
    return summarizeOnDevice(segments);
  },
};
