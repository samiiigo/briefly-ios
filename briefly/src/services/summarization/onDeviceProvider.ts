/**
 * OnDeviceProvider — on-device summarization via llama.rn + Gemma GGUF (SRP)
 *
 * Requires the model to be downloaded from Settings → Summarization first.
 * Runs inference in a short-lived llama context and surfaces memory/device
 * errors without silently falling back to extractive summaries.
 */

import { Platform } from 'react-native';
import { TranscriptSegment } from '@/types';
import { SummarizationProvider, SummarizationResult } from './summarizationProvider';
import { segmentsToText } from './summarizationUtils';
import { summarizeWithLocalLlama } from './local/localLlamaSummarizationService';
import { isLocalLlamaError, LocalLlamaError } from './local/localLlamaErrors';
import { logger } from '@/utils/logging/logger';

export class OnDeviceProvider implements SummarizationProvider {
  readonly name = 'on-device';

  async summarize(segments: TranscriptSegment[]): Promise<SummarizationResult> {
    const text = segmentsToText(segments);
    logger.info('SUMMARY', 'On-device llama summarization requested', {
      segmentCount: segments.length,
      chars: text.length,
      platform: Platform.OS,
    });

    try {
      const result = await summarizeWithLocalLlama(segments);
      logger.info('SUMMARY', 'On-device llama summarization completed', {
        keyInsightCount: result.keyInsights.length,
        hasTitle: !!result.title,
      });
      return result;
    } catch (error: unknown) {
      const mapped = isLocalLlamaError(error) ? error : new LocalLlamaError('unknown', error instanceof Error ? error.message : String(error));
      logger.error('SUMMARY', 'On-device llama summarization failed', {
        code: mapped.code,
        error: mapped.message,
      });
      throw mapped;
    }
  }
}
