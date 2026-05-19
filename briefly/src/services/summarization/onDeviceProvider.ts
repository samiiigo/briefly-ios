/**
 * OnDeviceProvider — on-device summarization strategy (SRP)
 *
 * Single responsibility: invoke the local BrieflyTranscriber Expo module for
 * local inference, falling back to extractive summarization.
 */

import { Platform } from 'react-native';
import { TranscriptSegment } from '@/types';
import { SummarizationProvider, SummarizationResult } from './summarizationProvider';
import {
  segmentsToText,
  generateId,
  extractiveSummarize,
  normalizeSummarizationResult,
  SUMMARIZATION_TIMEOUT_MS,
} from './summarizationUtils';
import { logger } from '@/utils/logging/logger';

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export class OnDeviceProvider implements SummarizationProvider {
  readonly name = 'on-device';

  async summarize(segments: TranscriptSegment[]): Promise<SummarizationResult> {
    const text = segmentsToText(segments);
    logger.info('SUMMARY', 'On-device summarization requested', {
      segmentCount: segments.length,
      chars: text.length,
      platform: Platform.OS,
      hasNativeModule: Platform.OS === 'ios',
    });

    if (Platform.OS === 'ios') {
      try {
        const { summarize } = await import('../../../modules/briefly-transcriber');
        const result = await withTimeout(summarize(text), SUMMARIZATION_TIMEOUT_MS);
        logger.info('SUMMARY', 'On-device native summarization completed', {
          keyInsightCount: result.keyInsights.length,
        });
        return normalizeSummarizationResult(
          {
            summary: result.summary,
            keyInsights: result.keyInsights.map((t) => ({
              id: generateId(),
              text: t,
            })),
          },
          text
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn('SUMMARY', 'Native on-device summarization failed; using extractive fallback', {
          error: message,
        });
      }
    }

    logger.info('SUMMARY', 'Using extractive summarization fallback');
    return extractiveSummarize(text);
  }
}
