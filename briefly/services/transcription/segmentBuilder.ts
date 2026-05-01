/**
 * Segment builder (SRP)
 *
 * Single responsibility: transform raw AssemblyAI word data into
 * sentence-level TranscriptSegment objects.
 */

import { TranscriptSegment } from '../../types';
import { splitCompleteSentences } from '../../lib/sentenceSplitter';

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type AssemblyAIWord = { text: string; start?: number; end?: number };

/**
 * Build sentence-level transcript segments from word-level timing data.
 */
export function buildSentenceSegments(words: AssemblyAIWord[]): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];

  let buffer = '';
  let sentenceStart = 0;
  let sentenceEnd = 0;
  let hasTime = false;

  const flush = () => {
    const text = buffer.trim();
    if (!text) return;
    segments.push({
      id: generateId(),
      text,
      startTime: sentenceStart,
      endTime: sentenceEnd,
      isFinal: true,
    });
    buffer = '';
    sentenceStart = sentenceEnd;
    hasTime = false;
  };

  words.forEach((word) => {
    const text = (word.text ?? '').trim();
    if (!text) return;

    const start = typeof word.start === 'number' ? word.start / 1000 : undefined;
    const end = typeof word.end === 'number' ? word.end / 1000 : undefined;
    if (!hasTime && typeof start === 'number') {
      sentenceStart = start;
      hasTime = true;
    }
    if (typeof end === 'number') {
      sentenceEnd = end;
    }

    buffer = buffer ? `${buffer} ${text}` : text;

    if (/[.!?]["')\]]*$/.test(text)) {
      flush();
    }
  });

  flush();
  return segments;
}

/**
 * Build segments from plain text (no word-level timing).
 */
export function buildFallbackSegments(text: string): TranscriptSegment[] {
  const { sentences, remainder } = splitCompleteSentences(text.replace(/\s+/g, ' ').trim());
  const allSentences = remainder ? [...sentences, remainder] : sentences;
  return allSentences.map((s) => ({
    id: generateId(),
    text: s,
    startTime: 0,
    endTime: 0,
    isFinal: true,
  }));
}
