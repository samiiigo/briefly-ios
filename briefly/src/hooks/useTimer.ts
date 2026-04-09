/**
 * useTimer hook (SRP)
 *
 * Single responsibility: elapsed-time counter for recording sessions.
 * Extracted from RecordingScreen to isolate timer logic from
 * transcription and UI concerns.
 */

import { useState, useRef, useCallback } from 'react';

export function useTimer() {
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    timerRef.current = setInterval(() => {
      setElapsed((e) => {
        elapsedRef.current = e + 1;
        return e + 1;
      });
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { elapsed, elapsedRef, start, stop };
}
