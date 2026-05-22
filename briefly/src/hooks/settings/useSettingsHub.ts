import { useMemo } from 'react';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { folderListLayoutTitle, useFolderListLayoutStore } from '@/context/useFolderListLayoutStore';
import { themePreferenceTitle } from '@/utils/theme/themePreference';
import { transcriptionModeTitle } from '@/utils/processing/transcriptionMode';
import { processingModeTitle } from '@/utils/processing/processingMode';
import { useTranscriptBackup } from '@/hooks/settings/useTranscriptBackup';
import { useClearCache } from '@/hooks/settings/useClearCache';
import { useProcessingSettingsSlice } from '@/hooks/settings/settingsStoreSlices';
export function useSettingsHub() {
  const router = useRouter();
  const {
    summarizationMode,
    transcriptionMode,
    showLivePreview,
    setShowLivePreview,
    themePreference,
  } = useProcessingSettingsSlice();
  const folderLayout = useFolderListLayoutStore((s) => s.layout);
  const transcriptBackup = useTranscriptBackup();
  const clearCache = useClearCache();
  const storageBusy = transcriptBackup.busy || clearCache.busy;
  const appVersionLabel = useMemo(() => {
    const name = Constants.expoConfig?.name ?? 'Briefly';
    const version = Constants.expoConfig?.version ?? '5.2.7';
    return `${name} ${version}`;
  }, []);
  const routes = useMemo(
    () => ({
      transcriptionMode: () => router.push('/settings/transcription-mode'),
      processingMode: () => router.push('/settings/processing-mode'),
      folderLayout: () => router.push('/settings/folder-layout'),
      appearance: () => router.push('/settings/appearance'),
    }),
    [router],
  );
  const labels = useMemo(
    () => ({
      transcriptionMode: transcriptionModeTitle(transcriptionMode),
      summarizationMode: processingModeTitle(summarizationMode),
      folderLayout: folderListLayoutTitle(folderLayout),
      theme: themePreferenceTitle(themePreference),
    }),
    [folderLayout, summarizationMode, themePreference, transcriptionMode],
  );
  return {
    showLivePreview,
    setShowLivePreview,
    labels,
    routes,
    storageBusy,
    exportTranscripts: transcriptBackup.exportTranscripts,
    importTranscripts: transcriptBackup.importTranscripts,
    confirmAndClearCache: clearCache.confirmAndClearCache,
    appVersionLabel,
  };
}
