import { RecordingFolder, TranscriptSegment } from '@/types';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useSettingsStore } from '@/context/useSettingsStore';
import { generateId, generateTitle, ensureUniqueTitle } from '@/utils';
import { normalizeTranscriptionMode } from '@/utils/transcriptionMode';
import { folderFlagsFor } from '@/utils/folders/recordingFolder';
import {
  initialStatusAfterSave,
  startRecordingBackgroundProcessing,
} from '@/services/recording/recordingBackgroundProcessing';

export type SaveCapturedRecordingParams = {
  duration: number;
  filePath: string;
  fileSize: number;
  targetFolder?: RecordingFolder;
  targetUserFolderId?: string;
  markImported?: boolean;
  preTranscript?: TranscriptSegment[];
  title?: string;
};

export async function saveCapturedRecording(params: SaveCapturedRecordingParams): Promise<string> {
  const { addRecording, recordings } = useRecordingStore.getState();
  const existingTitles = recordings.map((r) => r.title);
  const { summarizationMode, transcriptionMode } = useSettingsStore.getState();

  const id = generateId();
  const targetFolder = params.targetFolder ?? 'unlisted';
  const baseTitle = params.title?.trim() || generateTitle();
  const safeTitle = ensureUniqueTitle(baseTitle, existingTitles);

  await addRecording({
    id,
    title: safeTitle,
    createdAt: Date.now(),
    duration: params.duration,
    filePath: params.filePath,
    fileSize: params.fileSize,
    transcriptionMode: normalizeTranscriptionMode(transcriptionMode),
    processingMode: summarizationMode,
    folder: targetFolder,
    ...folderFlagsFor(targetFolder),
    ...(params.markImported ? { isImported: true } : {}),
    userFolderId: params.targetUserFolderId,
    status: initialStatusAfterSave(transcriptionMode, params.preTranscript),
    transcript: params.preTranscript,
  });

  startRecordingBackgroundProcessing(id);
  return id;
}
