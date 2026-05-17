import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useUserFolderStore } from '@/context/useUserFolderStore';
import { usePlayback } from '@/hooks/usePlayback';
import { useExport } from '@/hooks/useExport';
import { KeyInsights } from '@/components/features/recording/KeyInsights';
import { RecordingTitleHero } from '@/components/features/recording/RecordingTitleHero';
import { SummaryMarkdownSection } from '@/components/features/recording/SummaryMarkdownSection';
import { RecordingDetailHeader } from '@/components/features/recording/RecordingDetailChrome';
import { RecordingPlaybackBar } from '@/components/features/recording/RecordingPlaybackBar';
import { StackScreenHeader } from '@/components/navigation/StackScreenHeader';
import { TopBlurFade } from '@/components/navigation/TopBlurFade';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import { screenLayoutStyles as sl } from '@/components/navigation/screenLayout';
import { useSettingsStore } from '@/context/useSettingsStore';
import { ensureUniqueTitle } from '@/utils';
import { getNextSummarizationFallback } from '@/utils/summarizationFallback';
import { hasMeaningfulTranscript } from '@/utils/recordingValidation';
import { getRecordingFolderDisplayName } from '@/utils/folders/recordingFolder';
import { Colors, Spacing, BorderRadius, withAppFont } from '@/theme';

export default function TranscriptScreen() {
  const { scrollPaddingTop, topInset } = useTopChromeLayout();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: recordingId } = useLocalSearchParams<{ id: string }>();
  const recording = useRecordingStore((s) => s.getRecordingById(recordingId!));
  const { updateRecording, recordings, restoreRecording } = useRecordingStore();
  const folders = useUserFolderStore((s) => s.folders);
  const loadFolders = useUserFolderStore((s) => s.loadFolders);
  const { summarizationMode } = useSettingsStore();

  useEffect(() => {
    void loadFolders();
  }, [loadFolders]);

  const folderLabel = useMemo(
    () => (recording ? getRecordingFolderDisplayName(recording, folders) : ''),
    [recording, folders],
  );

  const playback = usePlayback({
    filePath: recording?.filePath ?? '',
    transcript: recording?.transcript,
  });
  const { isExportingPdf, openShareMenu } = useExport(recording);

  const handleRename = useCallback(() => {
    if (!recording) return;
    const existingTitles = recordings.filter((r) => r.id !== recording.id).map((r) => r.title);
    const save = (text: string) => { const t = text.trim(); if (t) updateRecording(recording.id, { title: ensureUniqueTitle(t, existingTitles) }); };
    if (Platform.OS === 'ios') { Alert.prompt('Rename Recording', undefined, save, 'plain-text', recording.title); }
    else { Alert.alert('Rename', 'Long-press the recording card on the home screen to rename it.'); }
  }, [recording, recordings, updateRecording]);

  const handleTranscriptionFallback = useCallback(async () => {
    if (!recording || !recordingId) return;
    const { summarizationMode: activeSummarizationMode } = useSettingsStore.getState();
    await updateRecording(recording.id, {
      status: 'transcribing',
      errorMessage: undefined,
      transcript: undefined,
      summary: undefined,
      keyInsights: undefined,
      mainEmoji: undefined,
      processingMode: activeSummarizationMode,
    });
    router.replace({
      pathname: '/recording/summarizing',
      params: { recordingId: recording.id, forceAudioFallback: 'true' },
    });
  }, [recording, recordingId, updateRecording, router]);

  const handleSummarizationFallback = useCallback(
    async (mode: typeof summarizationMode) => {
      if (!recording || !recordingId) return;
      await updateRecording(recording.id, {
        status: 'summarizing',
        errorMessage: undefined,
        summary: undefined,
        keyInsights: undefined,
        mainEmoji: undefined,
        processingMode: mode,
      });
      router.replace({
        pathname: '/recording/summarizing',
        params: { recordingId: recording.id, retrySummarizationMode: mode },
      });
    },
    [recording, recordingId, updateRecording, router],
  );

  const handleStartProcessing = useCallback(async () => {
    if (!recording) return;
    router.replace({ pathname: '/recording/summarizing', params: { recordingId: recording.id } });
  }, [recording, router]);

  const handleRerunSummarization = useCallback(async () => {
    if (!recording || !recordingId) return;
    if (!hasMeaningfulTranscript(recording.transcript)) {
      Alert.alert(
        'No transcript',
        'There is no transcript to summarize. Transcribe this recording first.',
      );
      return;
    }
    const mode = useSettingsStore.getState().summarizationMode;
    await updateRecording(recording.id, {
      status: 'summarizing',
      errorMessage: undefined,
      summary: undefined,
      keyInsights: undefined,
      mainEmoji: undefined,
      processingMode: mode,
    });
    router.replace({
      pathname: '/recording/summarizing',
      params: { recordingId: recording.id, retrySummarizationMode: mode },
    });
  }, [recording, recordingId, updateRecording, router]);

  const handleToggleFavorite = useCallback(() => {
    if (!recording) return;
    updateRecording(recording.id, { isFavorite: !recording.isFavorite });
  }, [recording, updateRecording]);

  const handleViewTranscript = useCallback(() => {
    if (!recording) return;
    const hasTranscript = (recording.transcript?.length ?? 0) > 0;
    if (!hasTranscript) {
      if (recording.status === 'transcribing' || recording.status === 'summarizing') {
        Alert.alert('Processing', 'The transcript is not ready yet.');
      } else if (recording.status === 'saved') {
        Alert.alert('No transcript', 'Transcribe this recording first.');
      } else {
        Alert.alert('No transcript', 'No transcript is available for this recording.');
      }
      return;
    }
    router.push({
      pathname: '/recording/transcript',
      params: { recordingId: recording.id },
    });
  }, [recording, router]);

  if (!recording) {
    return (
      <View style={sl.container}>
        <Text style={st.notFound}>Recording not found.</Text>
      </View>
    );
  }

  if (recording.deletedAt != null) {
    return (
      <View style={sl.container}>
        <View style={[st.deletedOverlay, { paddingTop: scrollPaddingTop }]}>
          <Ionicons name="trash-outline" size={48} color={Colors.subtext} style={{ marginBottom: 16 }} />
          <Text style={st.deletedOverlayTitle}>Recording in Deleted</Text>
          <Text style={st.deletedOverlayMessage}>
            Restore this recording to open it.
          </Text>
          <TouchableOpacity
            style={st.restoreButton}
            onPress={() => restoreRecording(recording.id).then(() => router.back())}
          >
            <Ionicons name="arrow-undo" size={20} color={Colors.textPrimary} />
            <Text style={st.restoreButtonText}>Restore recording</Text>
          </TouchableOpacity>
        </View>
        <TopBlurFade />
        <View style={[sl.headerOverlay, { paddingTop: topInset }]} pointerEvents="box-none">
          <StackScreenHeader title="Deleted" showBack onBack={() => router.back()} />
        </View>
      </View>
    );
  }

  const lastSummarizationMode = recording.processingMode ?? summarizationMode;
  const summarizationFallback =
    recording.status === 'error' && hasMeaningfulTranscript(recording.transcript)
      ? getNextSummarizationFallback(lastSummarizationMode, [lastSummarizationMode])
      : null;
  const showTranscriptionFallbackOnError =
    recording.status === 'error' &&
    (!hasMeaningfulTranscript(recording.transcript) || !summarizationFallback);
  const overflowMenuItems = [
    { label: 'Rename', onPress: handleRename },
    {
      label: recording.isFavorite ? 'Unfavorite' : 'Favorite',
      onPress: handleToggleFavorite,
    },
    { label: 'View transcript', onPress: handleViewTranscript },
    {
      label: 'Rerun summarization',
      onPress: () => {
        void handleRerunSummarization();
      },
    },
  ];

  return (
    <View style={sl.container}>
      <ScrollView
        style={st.scroll}
        contentContainerStyle={[st.scrollContent, { paddingTop: scrollPaddingTop }]}
        showsVerticalScrollIndicator={false}
      >
        <RecordingTitleHero recording={recording} />
        {(recording.status === 'saved' || recording.status === 'transcribing' || recording.status === 'summarizing') && (
          <View style={st.processingBanner}><View style={st.errorBannerTop}><Ionicons name="sparkles" size={16} color={Colors.primary} /><Text style={st.processingBannerTitle}>{recording.status === 'saved' && (recording.transcript?.length ?? 0) > 0 ? 'Summarization pending' : recording.status === 'saved' ? 'Ready to process' : 'Processing incomplete'}</Text></View><TouchableOpacity style={st.retryButton} onPress={handleStartProcessing}><Ionicons name="sparkles" size={15} color={Colors.textPrimary} /><Text style={st.retryButtonText}>{recording.status === 'saved' && (recording.transcript?.length ?? 0) > 0 ? 'Run Summarization' : 'Transcribe & Summarize'}</Text></TouchableOpacity></View>
        )}
        {recording.status === 'error' && (
          <View style={st.errorBanner}>
            <View style={st.errorBannerTop}>
              <Ionicons name="warning" size={16} color={Colors.orange} />
              <Text style={st.errorBannerTitle}>Processing failed</Text>
            </View>
            {!!recording.errorMessage && (
              <Text style={st.errorBannerMessage} numberOfLines={4}>
                {recording.errorMessage}
              </Text>
            )}
            {summarizationFallback ? (
              <TouchableOpacity
                style={st.retryButton}
                onPress={() => handleSummarizationFallback(summarizationFallback.mode)}
              >
                <Ionicons name="sparkles" size={15} color={Colors.textPrimary} />
                <Text style={st.retryButtonText}>{summarizationFallback.buttonLabel}</Text>
              </TouchableOpacity>
            ) : null}
            {showTranscriptionFallbackOnError ? (
              <TouchableOpacity style={st.retryButton} onPress={handleTranscriptionFallback}>
                <Ionicons name="mic-outline" size={15} color={Colors.textPrimary} />
                <Text style={st.retryButtonText}>Transcribe from recording</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
        {recording.keyInsights && recording.keyInsights.length > 0 && (
          <KeyInsights insights={recording.keyInsights} />
        )}
        {recording.summary ? (
          <SummaryMarkdownSection
            markdown={recording.summary}
            hasKeyInsights={(recording.keyInsights?.length ?? 0) > 0}
          />
        ) : null}
      </ScrollView>
      <RecordingPlaybackBar
        recording={recording}
        playback={playback}
        paddingBottom={Math.max(insets.bottom, 12) + Spacing.sm}
      />

      <TopBlurFade />
      <View style={[sl.headerOverlay, { paddingTop: topInset }]} pointerEvents="box-none">
        <RecordingDetailHeader
          onBack={() => router.back()}
          folderLabel={folderLabel}
          onShare={openShareMenu}
          shareDisabled={isExportingPdf}
          menuItems={overflowMenuItems}
        />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  notFound: withAppFont({
    color: Colors.textPrimary,
    padding: Spacing.md,
    fontSize: 17,
  }),
  deletedOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  deletedOverlayTitle: withAppFont({
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  }),
  deletedOverlayMessage: withAppFont({
    fontSize: 15,
    color: Colors.subtext,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  }),
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.cardXL,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  restoreButtonText: withAppFont({
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
  }),
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: 140,
  },
  processingBanner: {
    backgroundColor: 'rgba(10,132,255,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(10,132,255,0.35)',
    borderRadius: BorderRadius.cardXL,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  processingBannerTitle: withAppFont({
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  }),
  errorBanner: {
    backgroundColor: 'rgba(255,159,10,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,159,10,0.35)',
    borderRadius: BorderRadius.cardXL,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  errorBannerTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorBannerTitle: withAppFont({
    fontSize: 14,
    fontWeight: '600',
    color: Colors.orange,
  }),
  errorBannerMessage: withAppFont({
    fontSize: 13,
    color: Colors.subtext,
    lineHeight: 18,
  }),
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    marginTop: 4,
  },
  retryButtonText: withAppFont({
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  }),
});
