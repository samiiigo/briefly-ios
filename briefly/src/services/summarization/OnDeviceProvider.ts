/**
 * OnDeviceProvider — on-device summarization strategy (SRP)
 *
 * Single responsibility: invoke the native BrieflyTranscriber module for
 * local inference, falling back to extractive summarization.
 */

import { Platform, NativeModules } from 'react-native';
import { TranscriptSegment } from '../../types';
import { SummarizationProvider, SummarizationResult } from './SummarizationProvider';
import { segmentsToText, generateId, extractiveSummarize } from './summarizationUtils';
import { logger } from '../../utils/logger';

const { BrieflyTranscriber } = NativeModules;

export class OnDeviceProvider implements SummarizationProvider {
  readonly name = 'on-device';

  async summarize(segments: TranscriptSegment[]): Promise<SummarizationResult> {
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
      }
    }

    logger.info('SUMMARY', 'Using extractive summarization fallback');
    return extractiveSummarize(text);
  }
}
