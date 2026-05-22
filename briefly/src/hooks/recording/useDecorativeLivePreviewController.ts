import { useCallback, useRef } from 'react';
import {
  DecorativeLivePreview,
  DecorativeOnDeviceLivePreview,
} from '@/services/audio';
import type { LiveTranscriptionCallbacks } from '@/services/audio';
import type { DecorativePreviewEngine } from '@/utils/processing/transcriptionMode';
export type ActivePreviewEngine = DecorativePreviewEngine | 'none';
export interface DecorativeLivePreviewControllerOptions {
  enabled: boolean;
  engine: DecorativePreviewEngine;
  callbacks: Pick<
    LiveTranscriptionCallbacks,
    'onPartial' | 'onFinal' | 'onConnectionState'
  >;
  onPreviewError?: (message: string) => void;
  getActiveRecordingUri: () => string | undefined;
}
export function useDecorativeLivePreviewController({
  enabled,
  engine,
  callbacks,
  onPreviewError,
  getActiveRecordingUri,
}: DecorativeLivePreviewControllerOptions) {
  const activeEngineRef = useRef<ActivePreviewEngine>('none');
  const stopPreview = useCallback(() => {
    if (activeEngineRef.current === 'cloud') {
      DecorativeLivePreview.stop();
    } else if (activeEngineRef.current === 'on-device') {
      DecorativeOnDeviceLivePreview.stop();
    }
    activeEngineRef.current = 'none';
  }, []);
  const startPreview = useCallback(async () => {
    if (!enabled || engine === 'none') return;
    activeEngineRef.current = engine;
    const onError = (msg: string) => onPreviewError?.(msg);
    if (engine === 'cloud') {
      await DecorativeLivePreview.start(getActiveRecordingUri, {
        ...callbacks,
        onError,
      });
      return;
    }
    if (engine === 'on-device') {
      await DecorativeOnDeviceLivePreview.start({
        ...callbacks,
        onError,
      });
    }
  }, [callbacks, engine, enabled, getActiveRecordingUri, onPreviewError]);
  const pausePreview = useCallback(() => {
    if (activeEngineRef.current === 'cloud') {
      DecorativeLivePreview.pause();
    } else if (activeEngineRef.current === 'on-device') {
      void DecorativeOnDeviceLivePreview.pause();
    }
  }, []);
  const resumePreview = useCallback(async () => {
    if (activeEngineRef.current === 'cloud') {
      DecorativeLivePreview.resume();
    } else if (activeEngineRef.current === 'on-device') {
      await DecorativeOnDeviceLivePreview.resume();
    }
  }, []);
  return {
    activeEngineRef,
    stopPreview,
    startPreview,
    pausePreview,
    resumePreview,
  };
}
