import { summarize as summarizeWithNativeModule } from '../../../../modules/briefly-transcriber';
import { SummarizationResult } from '../summarizationProvider';
import { extractiveSummarize, generateId } from '../summarizationUtils';
import { isAndroid } from '@/utils/platform';
import { supportsNativeOnDeviceSummarization } from '@/utils/platformCapabilities';
import { logger } from '@/utils/logging/logger';

const STALE_NATIVE_IOS_ONLY_MESSAGE = 'only available on ios';

function isStaleNativeSummarizeRejection(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return message.includes(STALE_NATIVE_IOS_ONLY_MESSAGE) || message.includes('not_implemented');
}

function nativeResultToSummarizationResult(
  result: Awaited<ReturnType<typeof summarizeWithNativeModule>>,
  trimmed: string,
): SummarizationResult {
  const overview = result.summary?.trim() ?? '';
  const summary = overview
    ? `## Summary\n\n${overview}`
    : `## Summary\n\n${trimmed.slice(0, 200)}`;

  const keyInsights = (result.keyInsights ?? [])
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0)
    .map((item) => ({ id: generateId(), text: item }));

  return { summary, keyInsights };
}

async function summarizeWithNativeExtractive(text: string): Promise<SummarizationResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('No transcript text to summarize.');
  }

  const result = await summarizeWithNativeModule(trimmed);
  return nativeResultToSummarizationResult(result, trimmed);
}

/**
 * Extractive on-device summary. Uses JS on Android (reliable without native rebuild).
 * On iOS, tries BrieflyTranscriber native first, then JS.
 */
export async function summarizeExtractiveOnDevice(text: string): Promise<SummarizationResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('No transcript text to summarize.');
  }

  if (isAndroid) {
    return extractiveSummarize(trimmed);
  }

  if (supportsNativeOnDeviceSummarization()) {
    try {
      return await summarizeWithNativeExtractive(trimmed);
    } catch (error: unknown) {
      logger.warn('SUMMARY', 'Native extractive summarization failed; using JS fallback', {
        error: error instanceof Error ? error.message : String(error),
        staleNative: isStaleNativeSummarizeRejection(error),
      });
    }
  }

  return extractiveSummarize(trimmed);
}
