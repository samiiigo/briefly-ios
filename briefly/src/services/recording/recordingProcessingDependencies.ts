import { TranscriptionService } from '@/services/transcription';
import { SummarizationService } from '@/services/summarization';
import { StoreBackedSummarizationModeReader } from '@/services/summarization/summarizationModeReader';
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
export function configureRecordingProcessingPorts(
  next: Partial<RecordingProcessingPorts>,
): void {
  activePorts = { ...activePorts, ...next };
}
export function resetRecordingProcessingPorts(): void {
  activePorts = createDefaultPorts();
}
