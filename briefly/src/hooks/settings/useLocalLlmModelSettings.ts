import { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import {
  cancelLocalGemmaModelDownload,
  ensureLocalGemmaModelDownloaded,
  refreshLocalLlmModelStateFromDisk,
} from '@/services/summarization';
import { useLocalLlmSettingsSlice } from './settingsStoreSlices';
export function useLocalLlmModelSettings() {
  const {
    localLlmModelReady,
    localLlmDownloadProgress,
    localLlmDownloadStatus,
    localLlmDownloadError,
    deleteLocalLlmModel,
  } = useLocalLlmSettingsSlice();
  useEffect(() => {
    refreshLocalLlmModelStateFromDisk();
  }, []);
  const isDownloading = localLlmDownloadStatus === 'downloading';
  const handleDownloadLocalModel = useCallback(async () => {
    if (isDownloading) return;
    try {
      await ensureLocalGemmaModelDownloaded();
    } catch {
      // Error stored on settings slice
    }
  }, [isDownloading]);
  const handleCancelDownload = useCallback(async () => {
    await cancelLocalGemmaModelDownload();
  }, []);
  const handleDeleteLocalModel = useCallback(() => {
    Alert.alert(
      'Delete on-device model?',
      'This removes the Gemma model from your device (~3.5 GB). You can download it again later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteLocalLlmModel();
          },
        },
      ],
    );
  }, [deleteLocalLlmModel]);
  return {
    localLlmModelReady,
    localLlmDownloadProgress,
    localLlmDownloadStatus,
    localLlmDownloadError,
    isDownloading,
    handleDownloadLocalModel,
    handleCancelDownload,
    handleDeleteLocalModel,
  };
}
