import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { AudioFileService } from '@/services/audio';
import { probeAudioDurationSec } from '@/services/audio/probeAudioDuration';
import { saveCapturedRecording } from '@/services/recording/saveCapturedRecording';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useSettingsStore } from '@/context/useSettingsStore';
import { generateId } from '@/utils';
import { getPathInfo } from '@/utils/fileSystem/pathInfo';
import { normalizeFileUri } from '@/utils/fileSystem/normalizeFileUri';
import {
  detectImportKind,
  extensionFromFilename,
  titleFromImportFilename,
} from '@/utils/recording/importKind';
import { minRecordingDurationHint } from '@/utils/recording/recordingValidation';
import { parseTranscriptBackupJson } from '@/utils/recording/transcriptBackup';
import { interceptOnDeviceSummarizationIfBlocked } from '@/utils/processing/localLlmSummarizationGate';
import { logger } from '@/utils/logging/logger';
import { backupEntriesToRecordings } from '@/utils/recording/transcriptBackup';
import {
  filterNewBackupEntries,
  findDuplicateAudioRecording,
} from '@/utils/recording/importDeduplication';
import { exportAllTranscripts } from '@/services/recording/transcriptBackupService';
import {
  MIN_RECORDING_DURATION_SEC,
  MIN_RECORDING_FILE_BYTES,
} from '@/utils/recording/recordingValidation';

export type ImportRecordingResult =
  | { kind: 'json-backup'; count: number; skipped: number }
  | { kind: 'audio'; recordingId: string; processingStarted: boolean };

function confirmImport(message: string, confirmLabel = 'Import'): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert('Import', message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, onPress: () => resolve(true) },
    ]);
  });
}

async function importJsonBackup(
  jsonText: string,
): Promise<{ count: number; skipped: number }> {
  const parsed = parseTranscriptBackupJson(jsonText);
  const { recordings, importRecordings } = useRecordingStore.getState();
  const { entries, skipped } = filterNewBackupEntries(parsed, recordings);

  if (entries.length === 0) {
    throw new Error(
      skipped > 0
        ? 'Everything in this backup is already in your library.'
        : 'No transcripts were found in this file.',
    );
  }

  const skippedNote =
    skipped > 0
      ? ` ${skipped} duplicate${skipped === 1 ? '' : 's'} will be skipped.`
      : '';
  const confirmed = await confirmImport(
    `Import ${entries.length} transcript${entries.length === 1 ? '' : 's'} from this backup?${skippedNote}`,
  );
  if (!confirmed) return { count: 0, skipped };

  const { summarizationMode } = useSettingsStore.getState();
  const incoming = backupEntriesToRecordings(
    entries,
    recordings.map((r) => r.title),
    summarizationMode,
  );
  await importRecordings(incoming);
  logger.info('Import', 'Imported JSON transcript backup', {
    count: incoming.length,
    skipped,
  });
  return { count: incoming.length, skipped };
}

async function importAudioAsset(params: {
  uri: string;
  name: string;
}): Promise<ImportRecordingResult | null> {
  const sourceUri = normalizeFileUri(params.uri);
  const ext = extensionFromFilename(params.name) || '.m4a';
  const destName = `import-${generateId()}${ext}`;
  const filePath = await AudioFileService.copyToDocuments(sourceUri, destName);
  const onDisk = getPathInfo(filePath);
  if (!onDisk.exists) {
    throw new Error('Could not copy the audio file into the app.');
  }

  const fileSize = onDisk.size ?? 0;
  let durationSec = await probeAudioDurationSec(filePath);

  if (fileSize < MIN_RECORDING_FILE_BYTES) {
    throw new Error(
      'This audio file is too small to transcribe. Use a longer recording (at least 10 seconds).',
    );
  }

  if (durationSec > 0 && durationSec < MIN_RECORDING_DURATION_SEC) {
    throw new Error(minRecordingDurationHint('save'));
  }

  if (durationSec <= 0) {
    // Compressed imports may not expose duration locally; transcription uses the file directly.
    durationSec = MIN_RECORDING_DURATION_SEC;
  }

  const { recordings } = useRecordingStore.getState();
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
  const confirmed = await confirmImport(
    `Import "${displayName}" and run transcription and summarization?`,
  );
  if (!confirmed) return null;

  const { summarizationMode } = useSettingsStore.getState();
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

export async function importFromPicker(): Promise<ImportRecordingResult | null> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    type: ['application/json', 'audio/*'],
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  const kind = detectImportKind({ name: asset.name, mimeType: asset.mimeType });
  if (!kind) {
    throw new Error('Unsupported file type. Choose a Briefly JSON backup or an audio file.');
  }

  const picked = new File(asset.uri);
  if (!picked.exists) {
    throw new Error('Could not read the selected file.');
  }

  if (kind === 'json-backup') {
    const jsonText = await picked.text();
    const { count, skipped } = await importJsonBackup(jsonText);
    if (count === 0) return null;
    const skippedNote =
      skipped > 0
        ? ` ${skipped} duplicate${skipped === 1 ? '' : 's'} were skipped.`
        : '';
    Alert.alert(
      'Import complete',
      `Added ${count} transcript${count === 1 ? '' : 's'}.${skippedNote}`,
    );
    return { kind: 'json-backup', count, skipped };
  }

  const audioResult = await importAudioAsset({
    uri: asset.uri,
    name: asset.name ?? 'Imported audio',
  });
  if (!audioResult || audioResult.kind !== 'audio') return null;

  Alert.alert(
    'Import started',
    audioResult.processingStarted
      ? 'Transcription and summarization are running. Open the recording to follow progress.'
      : 'Audio saved. Set up on-device summarization in Settings to process it.',
  );
  return audioResult;
}

export { exportAllTranscripts };
