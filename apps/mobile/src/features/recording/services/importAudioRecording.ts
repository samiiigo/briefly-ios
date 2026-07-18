import { generateId } from '@/shared/utils';
import { getPathInfo } from '@/shared/utils/fileSystem/pathInfo';
import { normalizeFileUri } from '@/shared/utils/fileSystem/normalizeFileUri';
import {
  extensionFromFilename,
  titleFromImportFilename,
} from '@/features/recording/utils/importKind';
import { minRecordingDurationHint ,
  MIN_RECORDING_DURATION_SEC,
  MIN_RECORDING_FILE_BYTES,
} from '@/features/recording/utils/recordingValidation';
import { findDuplicateAudioRecording } from '@/features/recording/utils/importDeduplication';
import { interceptOnDeviceSummarizationIfBlocked } from '@/features/processing/utils/localLlmSummarizationGate';
import { saveCapturedRecording } from '@/features/recording/services/saveCapturedRecording';
import { logger } from '@/shared/utils/logging/logger';

import type { ImportRecordingPorts } from './importRecordingPorts';
export type AudioImportResult = {
  kind: 'audio';
  recordingId: string;
  processingStarted: boolean;
};
export async function importAudioFromAsset(
  params: { uri: string; name: string },
  ports: ImportRecordingPorts,
): Promise<AudioImportResult | null> {
  const sourceUri = normalizeFileUri(params.uri);
  const ext = extensionFromFilename(params.name) || '.m4a';
  const destName = `import-${generateId()}${ext}`;
  const filePath = await ports.audio.copyToDocuments(sourceUri, destName);
  const onDisk = getPathInfo(filePath);
  if (!onDisk.exists) {
    throw new Error('Could not copy the audio file into the app.');
  }
  const fileSize = onDisk.size ?? 0;
  let durationSec = await ports.audio.probeDurationSec(filePath);
  if (fileSize < MIN_RECORDING_FILE_BYTES) {
    throw new Error(
      'This audio file is too small to transcribe. Use a longer recording (at least 10 seconds).',
    );
  }
  if (durationSec > 0 && durationSec < MIN_RECORDING_DURATION_SEC) {
    throw new Error(minRecordingDurationHint('save'));
  }
  if (durationSec <= 0) {
    durationSec = MIN_RECORDING_DURATION_SEC;
  }
  const recordings = ports.store.getRecordings();
  const duplicate = findDuplicateAudioRecording(recordings, {
    fileSize,
    durationSec,
  });
  if (duplicate) {
    throw new Error(
      `"${duplicate.title}" already uses this audio file. Import a different file or delete the existing recording first.`,
    );
  }
  const displayName = params.name.trim() || 'Audio file';
  const confirmed = await ports.confirmation.confirmImport(
    `Import "${displayName}" and run transcription and summarization?`,
  );
  if (!confirmed) return null;
  const summarizationMode = ports.settings.getSummarizationMode();
  const { id, summarizationBlocked } = await saveCapturedRecording({
    duration: durationSec,
    filePath,
    fileSize,
    markImported: true,
    title: titleFromImportFilename(params.name),
  });
  if (summarizationBlocked) {
    interceptOnDeviceSummarizationIfBlocked(summarizationMode);
  }
  logger.info('Import', 'Imported audio for processing', {
    recordingId: id,
    durationSec,
    fileSize,
    processingStarted: !summarizationBlocked,
  });
  return {
    kind: 'audio',
    recordingId: id,
    processingStarted: !summarizationBlocked,
  };
}
