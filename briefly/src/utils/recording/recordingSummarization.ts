import { Recording } from '@/types';
import { ensureUniqueTitle } from './recording';

export interface SummarizationRecordingFields {
  summary: string;
  keyInsights: NonNullable<Recording['keyInsights']>;
  mainEmoji?: string;
  title?: string;
}

export interface BuildRecordingReadyOptions {
  /** Titles of other recordings; used to dedupe the AI-generated title. */
  existingTitles?: string[];
}

/** Builds store updates after summarization completes. */
export function buildRecordingReadyFromSummarization(
  result: SummarizationRecordingFields,
  options?: BuildRecordingReadyOptions,
): Pick<Recording, 'summary' | 'keyInsights' | 'mainEmoji' | 'title'> {
  const updates: Pick<Recording, 'summary' | 'keyInsights' | 'mainEmoji' | 'title'> = {
    summary: result.summary,
    keyInsights: result.keyInsights,
    mainEmoji: result.mainEmoji,
  };

  const aiTitle = result.title?.trim();
  if (aiTitle) {
    updates.title = options?.existingTitles
      ? ensureUniqueTitle(aiTitle, options.existingTitles)
      : aiTitle;
  }

  return updates;
}
