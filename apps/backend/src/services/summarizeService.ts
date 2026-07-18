/** Request body for the summarize Supabase edge function. */
export interface SummarizeRequest {
  segments: Array<{
    text: string;
    start?: number;
    end?: number;
  }>;
}

export interface SummarizeKeyInsight {
  id?: string;
  title?: string;
  detail?: string;
  text?: string;
}

/** Response body from the summarize edge function. */
export interface SummarizeResponse {
  summary: string;
  keyInsights: SummarizeKeyInsight[];
  mainEmoji?: string;
  title?: string;
}

/** Build a flat transcript string from segment payloads. */
export function transcriptFromSegments(segments: SummarizeRequest['segments']): string {
  return segments
    .map((segment) => segment.text)
    .join('\n')
    .trim();
}
