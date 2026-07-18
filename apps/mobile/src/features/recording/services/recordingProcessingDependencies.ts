import { TranscriptionService } from '@/features/processing/transcription';
import { SummarizationService } from '@/features/processing/summarization';
import { StoreBackedSummarizationModeReader } from '@/features/processing/summarization/summarizationModeReader';
import { RecordingProcessingPorts } from './recordingProcessingPorts';
function createDefaultPorts(): RecordingProcessingPorts {
  return {
    transcription: TranscriptionService,
    summarization: SummarizationService,
    summarizationMode: new StoreBackedSummarizationModeReader(),
  };
}
let activePorts: RecordingProcessingPorts = createDefaultPorts();
export function getRecordingProcessingPorts(): RecordingProcessingPorts {
  return activePorts;
}
export function configureRecordingProcessingPorts(next: Partial<RecordingProcessingPorts>): void {
  activePorts = { ...activePorts, ...next };
}
export function resetRecordingProcessingPorts(): void {
  activePorts = createDefaultPorts();
}
