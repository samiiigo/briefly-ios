import { Alert } from 'react-native';
import { useRecordingStore } from '@/features/recording/state/useRecordingStore';
import { AudioFileService } from '@/features/recording/services/audio';
import { probeAudioDurationSec } from '@/features/recording/services/audio/probeAudioDuration';
import { getProcessingSettingsReader } from '@/features/settings/services/processingSettingsReaderRegistry';
import type { ImportRecordingPorts } from './importRecordingPorts';
const alertConfirmation: ImportRecordingPorts['confirmation'] = {
  confirmImport(message, confirmLabel = 'Import') {
    return new Promise((resolve) => {
      Alert.alert('Import', message, [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, onPress: () => resolve(true) },
      ]);
    });
  },
  alert(title, message) {
    Alert.alert(title, message);
  },
};
function createDefaultImportPorts(): ImportRecordingPorts {
  const settingsReader = getProcessingSettingsReader();
  return {
    store: {
      getRecordings: () => useRecordingStore.getState().recordings,
      importRecordings: (incoming) => useRecordingStore.getState().importRecordings(incoming),
    },
    settings: {
      getSummarizationMode: () => settingsReader.getSummarizationMode(),
    },
    audio: {
      copyToDocuments: (sourceUri, destName) =>
        AudioFileService.copyToDocuments(sourceUri, destName),
      probeDurationSec: probeAudioDurationSec,
    },
    confirmation: alertConfirmation,
  };
}
let activePorts: ImportRecordingPorts = createDefaultImportPorts();
export function getImportRecordingPorts(): ImportRecordingPorts {
  return activePorts;
}
export function configureImportRecordingPorts(next: Partial<ImportRecordingPorts>): void {
  activePorts = { ...activePorts, ...next };
}
export function resetImportRecordingPorts(): void {
  activePorts = createDefaultImportPorts();
}
