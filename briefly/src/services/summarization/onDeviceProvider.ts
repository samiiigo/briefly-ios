/**
 * OnDeviceProvider — on-device summarization
 *
 * Prefers Gemma via llama.rn when the GGUF is on disk; otherwise uses extractive
 * summarization (JS on Android; native then JS on iOS).
 */
import { Platform } from 'react-native';
import { TranscriptSegment } from '@/types';
import { SummarizationProvider, SummarizationResult } from './summarizationProvider';
import { segmentsToText } from './summarizationUtils';
import { isLocalGemmaModelDownloaded, isLocalLlmDownloadInProgress } from './local/gemmaModelDownload';
import { summarizeWithLocalLlama } from './local/localLlamaSummarizationService';
import { summarizeExtractiveOnDevice } from './local/nativeExtractiveSummarization';
import { supportsLocalLlamaSummarization } from '@/utils/platformCapabilities';
import { logger } from '@/utils/logging/logger';
function canUseGemmaSummarization(): boolean {
  return (
    supportsLocalLlamaSummarization() &&
    isLocalGemmaModelDownloaded() &&
    !isLocalLlmDownloadInProgress()
  );
}
export class OnDeviceProvider implements SummarizationProvider {
  readonly name = 'on-device';
  async summarize(segments: TranscriptSegment[]): Promise<SummarizationResult> {
    const text = segmentsToText(segments);
    logger.info('SUMMARY', 'On-device summarization requested', {
      segmentCount: segments.length,
      chars: text.length,
      platform: Platform.OS,
      gemma: canUseGemmaSummarization(),
    });
    if (canUseGemmaSummarization()) {
      try {
        const result = await summarizeWithLocalLlama(segments);
        logger.info('SUMMARY', 'On-device Gemma summarization completed', {
          keyInsightCount: result.keyInsights.length,
          hasTitle: !!result.title,
        });
        return result;
      } catch (error: unknown) {
        logger.warn('SUMMARY', 'Gemma summarization failed; using extractive fallback', {
          error: error instanceof Error ? error.message : String(error),
        });
        return summarizeExtractiveOnDevice(text);
      }
    }
    logger.info('SUMMARY', 'Using extractive on-device summarization');
    return summarizeExtractiveOnDevice(text);
  }
}
