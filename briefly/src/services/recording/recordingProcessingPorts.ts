import { ProcessingMode, TranscriptSegment, TranscriptionMode } from '@/types';
import { SummarizationResult } from '@/services/summarization/summarizationProvider';
import type { SummarizationModeReader } from '@/services/summarization/summarizationModeReader';
export type { SummarizationModeReader };
export interface AudioTranscriptionPort {
  transcribe(
    audioUri: string,
    onSegment?: (segment: TranscriptSegment) => void,
    mode?: TranscriptionMode,
  ): Promise<TranscriptSegment[]>;
}
export interface TranscriptSummarizationPort {
  summarize(
    segments: TranscriptSegment[],
    modeOverride?: ProcessingMode,
  ): Promise<SummarizationResult>;
}
export interface RecordingProcessingPorts {
  transcription: AudioTranscriptionPort;
  summarization: TranscriptSummarizationPort;
  summarizationMode: SummarizationModeReader;
}
