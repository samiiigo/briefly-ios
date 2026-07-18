import { TranscriptSegment, KeyInsight } from '@briefly/types';
import { invokeBrieflyFunction, requireAuthenticatedFunctionSession } from '@/api/brieflyFunctions';
import { SummarizationProvider } from './summarizationProvider';

interface ProxySummarizeResponse {
  summary: string;
  keyInsights: KeyInsight[];
  mainEmoji?: string;
  title?: string;
}

export class ProxySummarizationProvider implements SummarizationProvider {
  readonly name = 'Briefly Cloud';

  async summarize(segments: TranscriptSegment[]): Promise<ProxySummarizeResponse> {
    await requireAuthenticatedFunctionSession();
    return invokeBrieflyFunction<ProxySummarizeResponse>('summarize', {
      segments,
    });
  }
}
