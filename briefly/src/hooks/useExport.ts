/**
 * useExport hook (SRP)
 *
 * Single responsibility: PDF export and text sharing for recordings.
 * Extracted from TranscriptScreen to separate export logic from UI rendering.
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

export function useExport(recording: Recording | undefined) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);

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

  const openShareMenu = useCallback(() => {
    if (isExportingPdf) return;
    Alert.alert('Share Note', 'Choose what to share.', [
      { text: 'Share as Text', onPress: shareText },
      { text: 'Export to PDF', onPress: exportPdf },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [exportPdf, shareText, isExportingPdf]);

  return { isExportingPdf, exportPdf, shareText, openShareMenu };
}
