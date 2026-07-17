import { RecordingFolder } from '@/shared/types';
import { useRecordingStore } from '@/features/recording/state/useRecordingStore';
import { useSettingsStore } from '@/features/settings/state/useSettingsStore';
import { generateId, generateTitle, ensureUniqueTitle } from '@/shared/utils';
import { normalizeTranscriptionMode } from '@/features/processing/utils/transcriptionMode';
import { folderFlagsFor } from '@/features/library/utils/recordingFolder';
import {
  initialStatusAfterSave,
  startRecordingBackgroundProcessing,
} from '@/features/recording/services/recordingBackgroundProcessing';
import { getLocalLlmSummarizationBlocker } from '@/features/processing/summarization';
import { persistRecordingAudio } from '@/shared/utils/fileSystem/persistRecordingAudio';
export type SaveCapturedRecordingParams = {
  duration: number;
  filePath: string;
  fileSize: number;
  targetFolder?: RecordingFolder;
  targetUserFolderId?: string;
  markImported?: boolean;
  title?: string;
};
export type SaveCapturedRecordingResult = {
  id: string;
  summarizationBlocked: boolean;
};
export async function saveCapturedRecording(
  params: SaveCapturedRecordingParams,
): Promise<SaveCapturedRecordingResult> {
  const { addRecording, recordings } = useRecordingStore.getState();
  const existingTitles = recordings.map((r) => r.title);
  const { summarizationMode, transcriptionMode } = useSettingsStore.getState();
  const id = generateId();
  const targetFolder = params.targetFolder ?? 'unlisted';
  const baseTitle = params.title?.trim() || generateTitle();
  const safeTitle = ensureUniqueTitle(baseTitle, existingTitles);
  const summarizationBlocked = !!getLocalLlmSummarizationBlocker(summarizationMode);
  const { filePath, fileSize } = await persistRecordingAudio(id, params.filePath);
  await addRecording({
    id,
    title: safeTitle,
    createdAt: Date.now(),
    duration: params.duration,
    filePath,
    fileSize: fileSize || params.fileSize,
    transcriptionMode: normalizeTranscriptionMode(transcriptionMode),
    processingMode: summarizationMode,
    folder: targetFolder,
    ...folderFlagsFor(targetFolder),
    ...(params.markImported ? { isImported: true } : {}),
    userFolderId: params.targetUserFolderId,
    status: summarizationBlocked ? 'saved' : initialStatusAfterSave(transcriptionMode),
    transcript: undefined,
  });
  if (!summarizationBlocked) {
    startRecordingBackgroundProcessing(id);
  }
  return { id, summarizationBlocked };
}
