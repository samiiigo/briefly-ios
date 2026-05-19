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
import { useSettingsStore } from '@/context/useSettingsStore';
import {
  createSummarizationProvider,
  configureSummarizationProviderFactory,
  resetSummarizationProviderFactory,
} from './summarizationProviderFactory';
import { logger } from '@/utils/logging/logger';
import {
  assertLocalLlmReadyForSummarization,
  isOnDeviceSummarizationMode,
} from './local/localLlmAvailability';

// Re-export for external consumers
export type { SummarizationResult, SummarizationProvider } from './summarizationProvider';

export const SummarizationService = {
  /**
   * Resolves the active summarization mode from Settings when `modeOverride` is omitted,
   * so re-runs use the user's current choice instead of the mode stored on the recording.
   */
  async summarize(
    segments: TranscriptSegment[],
    modeOverride?: ProcessingMode,
  ): Promise<{ summary: string; keyInsights: KeyInsight[]; mainEmoji?: string; title?: string }> {
    const mode = modeOverride ?? useSettingsStore.getState().summarizationMode;
    logger.info('SUMMARY', 'Summarization requested', {
      mode,
      modeOverride: modeOverride ?? null,
      segmentCount: segments.length,
    });
    if (isOnDeviceSummarizationMode(mode)) {
      assertLocalLlmReadyForSummarization();
    }
    const provider = createSummarizationProvider(mode);
    return provider.summarize(segments);
  },
};

export {
  createSummarizationProvider,
  configureSummarizationProviderFactory,
  resetSummarizationProviderFactory,
};

export {
  ensureLocalGemmaModelDownloaded,
  isLocalGemmaModelDownloaded,
  getLocalGemmaModelPath,
  cancelLocalGemmaModelDownload,
  deleteLocalGemmaModel,
} from './local/gemmaModelDownload';
export { LocalModelStorageService } from '@/services/storage/localModelStorageService';
export type { ModelDownloadProgress } from './local/gemmaModelDownload';
export { LocalLlamaError, isLocalLlamaError } from './local/localLlamaErrors';
export {
  refreshLocalLlmModelStateFromDisk,
  getLocalLlmSummarizationBlocker,
  evaluateLocalLlmAvailability,
  isOnDeviceSummarizationMode,
  LOCAL_LLM_DOWNLOAD_IN_PROGRESS_MESSAGE,
  LOCAL_LLM_MODEL_NOT_READY_MESSAGE,
  LOCAL_LLM_UNSUPPORTED_BUILD_MESSAGE,
} from './local/localLlmAvailability';
export type { LocalLlmAvailability, LocalLlmBlockReason } from './local/localLlmAvailability';
