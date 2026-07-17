import { useState, useCallback, useMemo } from 'react';
import { Alert, Platform, Share } from 'react-native';
import type { AnchoredMenuItem } from '@/shared/components/ui/AnchoredOverflowMenu';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Recording } from '@/shared/types';
import {
  buildRecordingExportPdfHtml,
  buildRecordingExportPlainText,
  PDF_PAGE_MARGIN_PX,
} from '@/features/recording/utils/recordingExport';
import { ensureUploadableAudioUri } from '@/shared/utils/fileSystem/repairWavForUpload';
import { normalizeFileUri } from '@/shared/utils/fileSystem/normalizeFileUri';
import { getRecordingAudioAvailability } from '@/features/recording/utils/recordingPlayableAudio';
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
      const pageMargins = {
        left: PDF_PAGE_MARGIN_PX,
        top: PDF_PAGE_MARGIN_PX,
        right: PDF_PAGE_MARGIN_PX,
        bottom: PDF_PAGE_MARGIN_PX,
      };
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        ...(Platform.OS === 'ios' ? { margins: pageMargins } : {}),
      });
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
    const { hasAudio, filePath } = getRecordingAudioAvailability(recording);
    if (!hasAudio || !filePath) {
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
  const audioShareDisabled =
    recording != null && !getRecordingAudioAvailability(recording).hasAudio;
  const shareMenuItems: AnchoredMenuItem[] = useMemo(
    () => [
      { label: 'Share as Text', onPress: shareText },
      {
        label: 'Share Audio',
        onPress: shareAudio,
        loading: isSharingAudio,
        disabled: isSharingAudio || audioShareDisabled,
      },
      {
        label: 'Export to PDF',
        onPress: exportPdf,
        loading: isExportingPdf,
        disabled: isExportingPdf,
      },
    ],
    [audioShareDisabled, exportPdf, isExportingPdf, isSharingAudio, shareAudio, shareText],
  );
  return {
    isExportingPdf,
    isSharingAudio,
    shareBusy,
    shareMenuItems,
    exportPdf,
    shareText,
    shareAudio,
  };
}
