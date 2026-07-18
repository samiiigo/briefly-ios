import { TranscriptSegment, TranscriptionMode } from '@/shared/types';
export interface TranscriptionProvider {
  readonly name: string;
  transcribe(
    audioUri: string,
    onSegment?: (segment: TranscriptSegment) => void,
    mode?: TranscriptionMode,
  ): Promise<TranscriptSegment[]>;
}
