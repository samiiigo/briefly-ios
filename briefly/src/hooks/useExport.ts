/**
 * useExport hook (SRP)
 *
 * Single responsibility: PDF export, text sharing, and audio sharing for recordings.
 * Shared by recording detail screens for export and share actions.
 */

import { useState, useCallback } from 'react';
import { Alert, Share } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Recording } from '@/types';
import {
  buildRecordingExportPdfHtml,
  buildRecordingExportPlainText,
} from '@/utils/recording/recordingExport';
import { ensureUploadableAudioUri } from '@/utils/fileSystem/repairWavForUpload';
import { getPathInfo } from '@/utils/fileSystem/pathInfo';
import { normalizeFileUri } from '@/utils/fileSystem/normalizeFileUri';

function audioShareMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.m4a') || lower.endsWith('.mp4')) return 'audio/mp4';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.caf')) return 'audio/x-caf';
  return 'application/octet-stream';
}

function audioShareUti(uri: string): string | undefined {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.wav')) return 'com.microsoft.waveform-audio';
  if (lower.endsWith('.m4a') || lower.endsWith('.mp4')) return 'public.mpeg-4-audio';
  if (lower.endsWith('.mp3')) return 'public.mp3';
  if (lower.endsWith('.caf')) return 'com.apple.coreaudio-format';
  return undefined;
}

export function useExport(recording: Recording | undefined) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isSharingAudio, setIsSharingAudio] = useState(false);

  const exportPdf = useCallback(async () => {
    if (!recording) return;
    try {
      setIsExportingPdf(true);
      const html = buildRecordingExportPdfHtml(recording);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export note as PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF Ready', `PDF exported to:\n${uri}`);
      }
    } catch (error: any) {
      Alert.alert('Export failed', error?.message ?? 'Could not export this note as PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  }, [recording]);

  const shareText = useCallback(async () => {
    if (!recording) return;
    const message = buildRecordingExportPlainText(recording);
    try {
      await Share.share({ message, title: recording.title });
    } catch {}
  }, [recording]);

  const shareAudio = useCallback(async () => {
    if (!recording) return;
    const filePath = recording.filePath?.trim();
    if (!filePath) {
      Alert.alert('No audio', 'This note does not have a recording file to share.');
      return;
    }

    const onDisk = getPathInfo(filePath);
    if (!onDisk.exists) {
      Alert.alert('No audio', 'The recording file is missing from this device.');
      return;
    }

    try {
      setIsSharingAudio(true);
      const uri = normalizeFileUri(await ensureUploadableAudioUri(filePath));
      const mimeType = audioShareMimeType(uri);
      const UTI = audioShareUti(uri);
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType,
          dialogTitle: 'Share recording audio',
          ...(UTI ? { UTI } : {}),
        });
      } else {
        Alert.alert('Audio ready', `Recording file:\n${uri}`);
      }
    } catch (error: any) {
      Alert.alert('Share failed', error?.message ?? 'Could not share this recording audio.');
    } finally {
      setIsSharingAudio(false);
    }
  }, [recording]);

  const shareBusy = isExportingPdf || isSharingAudio;

  const openShareMenu = useCallback(() => {
    if (shareBusy) return;
    Alert.alert('Share Note', 'Choose what to share.', [
      { text: 'Share as Text', onPress: shareText },
      { text: 'Share Audio', onPress: shareAudio },
      { text: 'Export to PDF', onPress: exportPdf },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [exportPdf, shareAudio, shareText, shareBusy]);

  return {
    isExportingPdf,
    isSharingAudio,
    shareBusy,
    exportPdf,
    shareText,
    shareAudio,
    openShareMenu,
  };
}
