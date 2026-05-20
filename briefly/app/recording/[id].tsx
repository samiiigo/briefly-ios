import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
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
import { usePlaybackBarLayout } from '@/components/navigation/usePlaybackBarLayout';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import { useScreenLayoutStyles } from '@/components/navigation/screenLayout';
import { TextInputDialog } from '@/components/ui/TextInputDialog';
import { useSettingsStore } from '@/context/useSettingsStore';
import { builtInFolderName } from '@/constants/builtInFolders';
import { ensureUniqueTitle } from '@/utils';
import { getNextSummarizationFallback } from '@/utils/processing/summarizationFallback';
import { alertIfLocalLlmNotReady } from '@/utils/processing/localLlmSummarizationGate';
import {
  hasMeaningfulTranscript,
  hasRecordingAudio,
} from '@/utils/recording/recordingValidation';
import { isRecordingProcessing } from '@/utils/recording/recordingContentEmoji';
import { getRecordingFolderDisplayName } from '@/utils/folders/recordingFolder';
import {
  cancelRecordingBackgroundProcessing,
  startRecordingBackgroundProcessing,
  startRecordingSummarizationRetry,
} from '@/services/recording/recordingBackgroundProcessing';
import { Colors, Spacing, BorderRadius, withAppFont } from '@/theme';

export default function TranscriptScreen() {
  const sl = useScreenLayoutStyles();
  const { scrollPaddingTop } = useTopChromeLayout();
  const { paddingBottom: playbackBottom } = usePlaybackBarLayout();
  const router = useRouter();
  const { id: recordingId } = useLocalSearchParams<{ id: string }>();
  const recording = useRecordingStore((s) => s.getRecordingById(recordingId!));
  const { updateRecording, recordings, restoreRecording } = useRecordingStore();
  const folders = useUserFolderStore((s) => s.folders);
  const loadFolders = useUserFolderStore((s) => s.loadFolders);
  const { summarizationMode } = useSettingsStore();

  const [renameDialogVisible, setRenameDialogVisible] = useState(false);

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
  const { shareBusy, openShareMenu } = useExport(recording);

  const handleRename = useCallback(() => {
    if (!recording) return;
    const existingTitles = recordings.filter((r) => r.id !== recording.id).map((r) => r.title);
    const save = (text: string) => { const t = text.trim(); if (t) updateRecording(recording.id, { title: ensureUniqueTitle(t, existingTitles) }); };
    if (Platform.OS === 'ios') { Alert.prompt('Rename Recording', undefined, save, 'plain-text', recording.title); }
    else { setRenameDialogVisible(true); }
  }, [recording, recordings, updateRecording]);

  const handleTranscriptionFallback = useCallback(() => {
    if (!recording || !recordingId) return;
    startRecordingBackgroundProcessing(recording.id, { audioFallbackOnly: true });
  }, [recording, recordingId]);

  const handleSummarizationFallback = useCallback(
    (mode: typeof summarizationMode) => {
      if (!recording || !recordingId) return;
      if (recording.status === 'transcribing' || recording.status === 'summarizing') return;
      if (!alertIfLocalLlmNotReady(mode)) return;
      cancelRecordingBackgroundProcessing(recording.id);
      startRecordingSummarizationRetry(recording.id, mode);
    },
    [recording, recordingId],
  );

  const handleStartProcessing = useCallback(() => {
    if (!recording) return;
    const mode = useSettingsStore.getState().summarizationMode;
    if (!alertIfLocalLlmNotReady(mode)) return;
    startRecordingBackgroundProcessing(recording.id);
  }, [recording]);

  const handleRerunSummarization = useCallback(() => {
    if (!recording || !recordingId) return;
    if (recording.status === 'transcribing' || recording.status === 'summarizing') return;
    if (!hasMeaningfulTranscript(recording.transcript)) {
      Alert.alert(
        'No transcript',
        'There is no transcript to summarize. Transcribe this recording first.',
      );
      return;
    }
    const mode = useSettingsStore.getState().summarizationMode;
    if (!alertIfLocalLlmNotReady(mode)) return;
    cancelRecordingBackgroundProcessing(recording.id);
    startRecordingSummarizationRetry(recording.id, mode);
  }, [recording, recordingId]);

  const handleToggleFavorite = useCallback(() => {
    if (!recording) return;
    updateRecording(recording.id, { isFavorite: !recording.isFavorite });
  }, [recording, updateRecording]);

  const handleViewTranscript = useCallback(() => {
    if (!recording) return;
    const hasTranscript = (recording.transcript?.length ?? 0) > 0;
    const isTranscribing = recording.status === 'transcribing';
    const hasAudio = hasRecordingAudio(recording.filePath, recording.fileSize);

    if (hasTranscript || isTranscribing || hasAudio) {
      router.push({
        pathname: '/recording/transcript',
        params: { recordingId: recording.id },
      });
      return;
    }

    if (recording.status === 'saved') {
      Alert.alert('No transcript', 'Transcribe this recording first.');
    } else {
      Alert.alert('No transcript', 'No transcript is available for this recording.');
    }
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
          <Text style={st.deletedOverlayTitle}>
            Recording in {builtInFolderName('recently-deleted')}
          </Text>
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
        <StackScreenHeader
          title={builtInFolderName('recently-deleted')}
          showBack
          onBack={() => router.back()}
        />
      </View>
    );
  }

  const lastSummarizationMode = recording.processingMode ?? summarizationMode;
  const summarizationFallback =
    recording.status === 'error' && hasMeaningfulTranscript(recording.transcript)
      ? getNextSummarizationFallback(lastSummarizationMode, [lastSummarizationMode])
      : null;
  const hasAudio = hasRecordingAudio(recording.filePath, recording.fileSize);
  const hasTranscript = hasMeaningfulTranscript(recording.transcript);
  const showTranscriptionFallbackOnError =
    hasAudio &&
    recording.status === 'error' &&
    (!hasTranscript || !summarizationFallback);
  const isTranscribing = recording.status === 'transcribing';
  const isSummarizing = recording.status === 'summarizing';
  const showProcessingBanner =
    (recording.status === 'saved' || (isSummarizing && !hasTranscript)) &&
    (hasAudio || (recording.status === 'saved' && hasTranscript));
  const overflowMenuItems = [
    { label: 'Rename', onPress: handleRename },
    {
      label: recording.isFavorite ? 'Unfavorite' : 'Favorite',
      onPress: handleToggleFavorite,
    },
    { label: 'View transcript', onPress: handleViewTranscript },
    {
      label: isSummarizing ? 'Summarizing…' : 'Rerun summarization',
      onPress: handleRerunSummarization,
      loading: isSummarizing,
      disabled: isSummarizing,
    },
  ];

  return (
    <View style={sl.container}>
      <ScrollView
        style={st.scroll}
        contentContainerStyle={[
          st.scrollContent,
          { paddingTop: scrollPaddingTop, paddingBottom: hasAudio ? 140 : Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <RecordingTitleHero recording={recording} />
        {showProcessingBanner ? (
          <View style={st.processingBanner}>
            <View style={st.errorBannerTop}>
              <Ionicons name="sparkles" size={16} color={Colors.primary} />
              <Text style={st.processingBannerTitle}>
                {recording.status === 'saved' && hasTranscript
                  ? 'Summarization pending'
                  : recording.status === 'saved'
                    ? 'Ready to process'
                    : 'Processing incomplete'}
              </Text>
            </View>
            <TouchableOpacity style={st.retryButton} onPress={handleStartProcessing}>
              <Ionicons name="sparkles" size={15} color={Colors.textPrimary} />
              <Text style={st.retryButtonText}>
                {recording.status === 'saved' && hasTranscript
                  ? 'Run Summarization'
                  : 'Transcribe & Summarize'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
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
      {hasAudio ? (
        <RecordingPlaybackBar
          recording={recording}
          playback={playback}
          paddingBottom={playbackBottom}
        />
      ) : null}

      <RecordingDetailHeader
        onBack={() => router.back()}
        folderLabel={folderLabel}
        onShare={openShareMenu}
        shareDisabled={shareBusy}
        menuItems={overflowMenuItems}
        menuLoading={isTranscribing || isSummarizing}
      />
      <TextInputDialog
        visible={renameDialogVisible}
        title="Rename Recording"
        defaultValue={recording?.title ?? ''}
        placeholder="Recording name"
        submitLabel="Rename"
        onSubmit={(text) => {
          setRenameDialogVisible(false);
          if (recording) {
            const existingTitles = recordings.filter((r) => r.id !== recording.id).map((r) => r.title);
            updateRecording(recording.id, { title: ensureUniqueTitle(text, existingTitles) });
          }
        }}
        onCancel={() => setRenameDialogVisible(false)}
      />
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
