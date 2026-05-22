import { TranscriptSegment, KeyInsight } from '@/types';
export interface SummarizationResult {
  summary: string;
  keyInsights: KeyInsight[];
  /** Single emoji representing the overall transcript theme. */
  mainEmoji?: string;
  /** AI-generated display title (may include a leading emoji). */
  title?: string;
}
export interface SummarizationProvider {
  /** Human-readable name for logging / error messages. */
  readonly name: string;
  /** Summarize transcript segments and return structured result. */
  summarize(segments: TranscriptSegment[]): Promise<SummarizationResult>;
}
