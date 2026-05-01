/**
 * SummarizationProvider — Strategy interface (DIP + OCP)
 *
 * All summarization strategies implement this single interface.
 * New providers can be added without modifying existing code (OCP).
 * High-level code depends on this abstraction, not concrete classes (DIP).
 */

import { TranscriptSegment, KeyInsight } from '../../types';

export interface SummarizationResult {
  summary: string;
  keyInsights: KeyInsight[];
}

export interface SummarizationProvider {
  /** Human-readable name for logging / error messages. */
  readonly name: string;

  /** Summarize transcript segments and return structured result. */
  summarize(segments: TranscriptSegment[]): Promise<SummarizationResult>;
}
