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
import { formatDuration, formatDate } from '@/utils';

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPdfHtml(recording: Recording): string {
  const summary = recording.summary ?? 'No summary available.';
  const insights = recording.keyInsights ?? [];
  const transcript = recording.transcript ?? [];

  const insightItems = insights.length
    ? insights.map((item) => `<li>${escapeHtml(item.text)}</li>`).join('')
    : '<li>No key points detected.</li>';

  const transcriptItems = transcript.length
    ? transcript
        .map(
          (segment) => `
      <div class="segment">
        <div class="segment-time">${escapeHtml(formatDuration(segment.startTime))} - ${escapeHtml(formatDuration(segment.endTime))}</div>
        <div class="segment-text">${escapeHtml(segment.text)}</div>
      </div>
    `
        )
        .join('')
    : '<p class="muted">No transcript available.</p>';

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 32px; color: #111; }
          .title { font-size: 26px; font-weight: 700; margin-bottom: 6px; }
          .meta { font-size: 12px; color: #666; margin-bottom: 24px; }
          .section-title { font-size: 14px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; margin-top: 22px; margin-bottom: 10px; color: #222; }
          .summary { background: #f5f7fb; border: 1px solid #e6ebf5; border-radius: 10px; padding: 14px; font-size: 14px; line-height: 1.6; }
          ul { margin-top: 0; padding-left: 18px; }
          li { margin-bottom: 8px; font-size: 14px; line-height: 1.5; }
          .segment { border-bottom: 1px solid #ececec; padding: 10px 0; }
          .segment-time { font-size: 12px; color: #666; margin-bottom: 4px; }
          .segment-text { font-size: 14px; line-height: 1.6; }
          .muted { color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="title">${escapeHtml(recording.title)}</div>
        <div class="meta">Created ${escapeHtml(formatDate(recording.createdAt))} · Duration ${escapeHtml(formatDuration(recording.duration))}</div>
        <div class="section-title">Summary</div>
        <div class="summary">${escapeHtml(summary)}</div>
        <div class="section-title">Key Points / Action Items</div>
        <ul>${insightItems}</ul>
        <div class="section-title">Transcript</div>
        ${transcriptItems}
      </body>
    </html>
  `;
}

export function useExport(recording: Recording | undefined) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const exportPdf = useCallback(async () => {
    if (!recording) return;
    try {
      setIsExportingPdf(true);
      const html = buildPdfHtml(recording);
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
    const summary = recording.summary?.trim() || 'No summary available.';
    const insights = (recording.keyInsights ?? []).map((k) => `• ${k.text}`).join('\n');
    const transcript = (recording.transcript ?? []).map((s) => s.text).join(' ').trim();
    const message =
      `${recording.title}\n` +
      `${formatDate(recording.createdAt)}\n\n` +
      `Summary:\n${summary}\n\n` +
      `Key Points / Action Items:\n${insights || 'None'}\n\n` +
      `Transcript:\n${transcript || 'No transcript available.'}`;
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
