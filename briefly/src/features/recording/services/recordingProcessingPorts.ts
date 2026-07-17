import { ProcessingMode, TranscriptSegment, TranscriptionMode } from '@/shared/types';
import { SummarizationResult } from '@/features/processing/summarization/summarizationProvider';
import type { SummarizationModeReader } from '@/features/processing/summarization/summarizationModeReader';
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
