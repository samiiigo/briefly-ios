import { useMemo } from 'react';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import {
  folderListLayoutTitle,
  useFolderListLayoutStore,
} from '@/features/library/state/useFolderListLayoutStore';
import { themePreferenceTitle } from '@briefly/theme/native';
import { transcriptionModeTitle } from '@/features/processing/utils/transcriptionMode';
import { processingModeTitle } from '@/features/processing/utils/processingMode';
import { useTranscriptBackup } from '@/features/settings/hooks/useTranscriptBackup';
import { useClearCache } from '@/features/settings/hooks/useClearCache';
import { useProcessingSettingsSlice } from '@/features/settings/hooks/settingsStoreSlices';
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
    const version = Constants.expoConfig?.version ?? '5.2.7';
    const build = Constants.expoConfig?.ios?.buildNumber ?? Constants.nativeBuildVersion ?? null;
    return build ? `${version} (${build})` : version;
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
