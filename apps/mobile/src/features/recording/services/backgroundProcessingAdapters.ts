import { useRecordingStore } from '@/features/recording/state/useRecordingStore';
import { getProcessingSettingsReader } from '@/features/settings/services/processingSettingsReaderRegistry';
import { normalizeTranscriptionMode } from '@/features/processing/utils/transcriptionMode';
import {
  BackgroundProcessingPorts,
  BackgroundProcessingSettingsPort,
  RecordingBackgroundStorePort,
} from './backgroundProcessingPorts';
export class StoreBackedRecordingBackgroundStore implements RecordingBackgroundStorePort {
  getRecordingById(id: string) {
    return useRecordingStore.getState().getRecordingById(id);
  }
  getAllRecordings() {
    return useRecordingStore.getState().recordings;
  }
  updateRecording(id: string, updates: Partial<import('@/shared/types').Recording>) {
    return useRecordingStore.getState().updateRecording(id, updates);
  }
}
export class StoreBackedBackgroundProcessingSettings
  implements BackgroundProcessingSettingsPort
{
  getTranscriptionMode() {
    return normalizeTranscriptionMode(getProcessingSettingsReader().getTranscriptionMode());
  }
  getSummarizationMode() {
    return getProcessingSettingsReader().getSummarizationMode();
  }
}
function createDefaultBackgroundProcessingPorts(): BackgroundProcessingPorts {
  return {
    store: new StoreBackedRecordingBackgroundStore(),
    settings: new StoreBackedBackgroundProcessingSettings(),
  };
}
let activePorts: BackgroundProcessingPorts = createDefaultBackgroundProcessingPorts();
export function getBackgroundProcessingPorts(): BackgroundProcessingPorts {
  return activePorts;
}
export function configureBackgroundProcessingPorts(
  next: Partial<BackgroundProcessingPorts>,
): void {
  activePorts = { ...activePorts, ...next };
}
export function resetBackgroundProcessingPorts(): void {
  activePorts = createDefaultBackgroundProcessingPorts();
}
