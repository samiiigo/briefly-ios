/**
 * SummarizationService — refactored public API
 *
 * The service is now a thin facade that delegates to the correct
 * SummarizationProvider via the factory. All provider-specific logic
 * lives in its own class (SRP), new providers can be added without
 * modifying this file (OCP), and the service depends only on the
 * SummarizationProvider interface (DIP).
 */

import { TranscriptSegment, KeyInsight, ProcessingMode } from '@/types';
import {
  createSummarizationProvider,
  configureSummarizationProviderFactory,
  resetSummarizationProviderFactory,
} from './summarizationProviderFactory';
import { logger } from '@/utils/logging/logger';

// Re-export for external consumers
export type { SummarizationResult, SummarizationProvider } from './summarizationProvider';

export const SummarizationService = {
  async summarize(
    segments: TranscriptSegment[],
    mode: ProcessingMode
  ): Promise<{ summary: string; keyInsights: KeyInsight[]; mainEmoji?: string; title?: string }> {
    logger.info('SUMMARY', 'Summarization requested', { mode, segmentCount: segments.length });
    const provider = createSummarizationProvider(mode);
    return provider.summarize(segments);
  },
};

export {
  createSummarizationProvider,
  configureSummarizationProviderFactory,
  resetSummarizationProviderFactory,
};
