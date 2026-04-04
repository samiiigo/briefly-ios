/**
 * useLiveTranscript hook (SRP)
 *
 * Single responsibility: manage live transcript accumulation state
 * (final segments, partial text, sentence buffering).
 *
 * Extracted from RecordingScreen so the screen component only
 * handles UI rendering and lifecycle orchestration.
 */

import { useState, useRef, useCallback } from 'react';
import { TranscriptSegment } from '../types';
import { splitCompleteSentences, appendChunk } from '../utils/sentenceSplitter';

function generateSegmentId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useLiveTranscript(
  setLiveTranscript: (text: string) => void,
  elapsedRef: React.MutableRefObject<number>
) {
  const [finalText, setFinalText] = useState('');
  const [partialText, setPartialText] = useState('');

  const liveSegments = useRef<TranscriptSegment[]>([]);
  const prevFinalText = useRef('');
  const finalSentenceBufferRef = useRef('');
  const isStopped = useRef(false);
  const pendingPartialRef = useRef('');
  const partialFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onPartial = useCallback((text: string) => {
    pendingPartialRef.current = text;
    if (!partialFlushTimerRef.current) {
      partialFlushTimerRef.current = setTimeout(() => {
        partialFlushTimerRef.current = null;
        if (isStopped.current) return;
        const buffered = pendingPartialRef.current;
        setPartialText(buffered);
        const accFinal = liveSegments.current.map((s) => s.text).join(' ');
        setLiveTranscript(accFinal ? `${accFinal} ${buffered}` : buffered);
      }, 80);
    }
  }, [setLiveTranscript]);

  const onFinal = useCallback((text: string) => {
    if (partialFlushTimerRef.current) {
      clearTimeout(partialFlushTimerRef.current);
      partialFlushTimerRef.current = null;
    }
    pendingPartialRef.current = '';

    const prev = prevFinalText.current;
    const newWords = prev
      ? text.startsWith(prev)
        ? text.slice(prev.length).trim()
        : text
      : text;

    if (newWords) {
      const merged = appendChunk(finalSentenceBufferRef.current, newWords);
      const { sentences, remainder } = splitCompleteSentences(merged);

      if (sentences.length > 0) {
        const endTime = elapsedRef.current;
        let cursorStart = liveSegments.current.length > 0
          ? liveSegments.current[liveSegments.current.length - 1].endTime
          : 0;
        liveSegments.current = [
          ...liveSegments.current,
          ...sentences.map((sentence) => {
            const segment: TranscriptSegment = {
              id: generateSegmentId(),
              text: sentence,
              startTime: cursorStart,
              endTime,
              isFinal: true,
            };
            cursorStart = endTime;
            return segment;
          }),
        ];
      }

      finalSentenceBufferRef.current = remainder;
    }

    prevFinalText.current = text;

    const accumulated = liveSegments.current.map((s) => s.text).join(' ');
    setFinalText(accumulated);
    setPartialText(finalSentenceBufferRef.current);
    setLiveTranscript(
      finalSentenceBufferRef.current
        ? appendChunk(accumulated, finalSentenceBufferRef.current)
        : accumulated
    );
  }, [elapsedRef, setLiveTranscript]);

  /** Flush any trailing partial/buffer text into a final segment. */
  const flush = useCallback(() => {
    isStopped.current = true;
    if (partialFlushTimerRef.current) {
      clearTimeout(partialFlushTimerRef.current);
      partialFlushTimerRef.current = null;
    }

    const trimmedPartial = (pendingPartialRef.current || partialText).trim();
    const trailingText = appendChunk(finalSentenceBufferRef.current, trimmedPartial);
    if (trailingText) {
      liveSegments.current = [
        ...liveSegments.current,
        {
          id: generateSegmentId(),
          text: trailingText,
          startTime: liveSegments.current.length > 0
            ? liveSegments.current[liveSegments.current.length - 1].endTime
            : 0,
          endTime: elapsedRef.current,
          isFinal: true,
        },
      ];
      setPartialText('');
      finalSentenceBufferRef.current = '';
    }
  }, [elapsedRef, partialText]);

  const reset = useCallback(() => {
    setFinalText('');
    setPartialText('');
    liveSegments.current = [];
    prevFinalText.current = '';
    finalSentenceBufferRef.current = '';
    isStopped.current = false;
  }, []);

  const cleanup = useCallback(() => {
    if (partialFlushTimerRef.current) {
      clearTimeout(partialFlushTimerRef.current);
      partialFlushTimerRef.current = null;
    }
  }, []);

  return {
    finalText,
    partialText,
    liveSegments,
    isStopped,
    onPartial,
    onFinal,
    flush,
    reset,
    cleanup,
  };
}
