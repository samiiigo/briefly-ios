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
import { RecordingProcessingFlashIcon } from '@/components/features/recording/RecordingProcessingFlashIcon';
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
import { alertIfLocalLlmNotReady } from '@/utils/processing/localLlmSummarizationGate';
import { hasMeaningfulTranscript } from '@/utils/recording/recordingValidation';
import { useRecordingAudioAvailability } from '@/hooks/useRecordingAudioAvailability';
import { useRecordingRetryFlashActive } from '@/hooks/useRecordingRetryFlashActive';
import { isRecordingProcessing } from '@/utils/recording/recordingContentEmoji';
import { getRecordingFolderDisplayName } from '@/utils/folders/recordingFolder';
import {
  executeManualRecordingRerun,
  executeSummarizationOnlyRerun,
} from '@/utils/recording/manualRecordingRerun';
import { resolveManualRerunSourceFromFlags } from '@/utils/recording/manualRecordingRerunSource';
import { canRerunSummaryFromTranscript } from '@/utils/recording/recordingRerunCapabilities';
import { useRecordingRetryFlashStore } from '@/context/useRecordingRetryFlashStore';
import { isAudioFileMissingError } from '@/utils/processing/processingErrors';
import {
  Spacing,
  BorderRadius,
  useCreateStyles,
  useThemedColors,
  withAppFont,
} from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';

export default function TranscriptScreen() {
  const st = useCreateStyles(createRecordingDetailStyles);
  const colors = useThemedColors();
  const sl = useScreenLayoutStyles();
  const { scrollPaddingTop } = useTopChromeLayout();
  const { paddingBottom: playbackBottom } = usePlaybackBarLayout();
  const router = useRouter();
  const { id: recordingId } = useLocalSearchParams<{ id: string }>();
  const recording = useRecordingStore((s) =>
    recordingId ? s.recordings.find((r) => r.id === recordingId) : undefined,
  );
  const { updateRecording, recordings, restoreRecording } = useRecordingStore();
  const folders = useUserFolderStore((s) => s.folders);
  const loadFolders = useUserFolderStore((s) => s.loadFolders);

  const [renameDialogVisible, setRenameDialogVisible] = useState(false);

  useEffect(() => {
    void loadFolders();
  }, [loadFolders]);

  const folderLabel = useMemo(
    () => (recording ? getRecordingFolderDisplayName(recording, folders) : ''),
    [recording, folders],
  );

  const audioAvailability = useRecordingAudioAvailability(recording);
  const hasTranscript = hasMeaningfulTranscript(recording?.transcript);
  const hasAudio = audioAvailability.hasAudio;
  const isProcessing = recording != null && isRecordingProcessing(recording);
  const canRerunSummary = recording != null && canRerunSummaryFromTranscript(recording);
  const manualRerunSource = resolveManualRerunSourceFromFlags(hasAudio, hasTranscript);
  const canManualRerun = manualRerunSource !== 'none';
  const summaryRerunDisabled = !recording || isProcessing || !canRerunSummary;
  const manualRerunDisabled = !recording || isProcessing || !canManualRerun;
  const flashActive = useRecordingRetryFlashActive(recording?.id);
  const manualRerunButtonDisabled = manualRerunDisabled || flashActive;

  const playback = usePlayback({
    filePath: audioAvailability.filePath,
    transcript: recording?.transcript,
  });
  const { shareBusy, shareMenuItems } = useExport(recording);

  const handleRename = useCallback(() => {
    if (!recording) return;
    const existingTitles = recordings.filter((r) => r.id !== recording.id).map((r) => r.title);
    const save = (text: string) => { const t = text.trim(); if (t) updateRecording(recording.id, { title: ensureUniqueTitle(t, existingTitles) }); };
    if (Platform.OS === 'ios') { Alert.prompt('Rename Recording', undefined, save, 'plain-text', recording.title); }
    else { setRenameDialogVisible(true); }
  }, [recording, recordings, updateRecording]);

  const markRerunPending = useCallback((recordingId: string) => {
    useRecordingRetryFlashStore.getState().markRetryPending(recordingId);
  }, []);

  const handleRerunSummary = useCallback(() => {
    if (summaryRerunDisabled || !recording) return;
    const mode = useSettingsStore.getState().summarizationMode;
    if (!alertIfLocalLlmNotReady(mode)) return;
    markRerunPending(recording.id);
    executeSummarizationOnlyRerun(recording.id);
  }, [markRerunPending, recording, summaryRerunDisabled]);

  const handleManualRerun = useCallback(() => {
    if (manualRerunButtonDisabled || !recording) return;
    const mode = useSettingsStore.getState().summarizationMode;
    if (!alertIfLocalLlmNotReady(mode)) return;
    markRerunPending(recording.id);
    if (manualRerunSource === 'audio') {
      executeManualRecordingRerun(recording.id, { audio: audioAvailability });
    } else {
      executeSummarizationOnlyRerun(recording.id);
    }
  }, [
    audioAvailability,
    manualRerunButtonDisabled,
    manualRerunSource,
    markRerunPending,
    recording,
  ]);

  const handleToggleFavorite = useCallback(() => {
    if (!recording) return;
    updateRecording(recording.id, { isFavorite: !recording.isFavorite });
  }, [recording, updateRecording]);

  const handleViewTranscript = useCallback(() => {
    if (!recording) return;
    const isTranscribing = recording.status === 'transcribing';

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
  }, [hasAudio, hasTranscript, recording, router]);

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
          <Ionicons name="trash-outline" size={48} color={colors.subtext} style={{ marginBottom: 16 }} />
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
            <Ionicons name="arrow-undo" size={20} color={colors.textPrimary} />
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

  const isSummarizing = recording.status === 'summarizing';
  const showProcessingBanner =
    (recording.status === 'saved' || (isSummarizing && !hasTranscript)) &&
    (hasAudio || (recording.status === 'saved' && hasTranscript));
  const hideAudioMissingBanner =
    recording.status === 'error' &&
    isAudioFileMissingError(recording.errorMessage ?? '');
  const overflowMenuItems = [
    { label: 'Rename', onPress: handleRename },
    {
      label: recording.isFavorite ? 'Unfavorite' : 'Favorite',
      onPress: handleToggleFavorite,
    },
    { label: 'View transcript', onPress: handleViewTranscript },
    {
      label: isSummarizing ? 'Summarizing…' : 'Re-run summary',
      onPress: handleRerunSummary,
      loading: isSummarizing,
      disabled: summaryRerunDisabled,
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
            <View style={st.processingBannerTop}>
              <Ionicons name="sparkles" size={16} color={colors.primary} />
              <Text style={st.processingBannerTitle}>
                {recording.status === 'saved' && hasTranscript
                  ? 'Summarization pending'
                  : recording.status === 'saved'
                    ? 'Ready to process'
                    : 'Processing incomplete'}
              </Text>
            </View>
            <TouchableOpacity
              style={[st.retryButton, manualRerunButtonDisabled && st.retryButtonDisabled]}
              onPress={handleManualRerun}
              disabled={manualRerunButtonDisabled}
            >
              {flashActive ? (
                <RecordingProcessingFlashIcon size={18} />
              ) : (
                <Ionicons name="sparkles" size={15} color={colors.textPrimary} />
              )}
              <Text style={st.retryButtonText}>
                {recording.status === 'saved' && hasTranscript
                  ? 'Run Summarization'
                  : 'Transcribe & Summarize'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {recording.status === 'error' &&
          !!recording.errorMessage &&
          !hideAudioMissingBanner && (
          <View style={st.errorBanner}>
            <Text style={st.errorBannerMessage} numberOfLines={4}>
              {recording.errorMessage}
            </Text>
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
        shareItems={shareMenuItems}
        shareLoading={shareBusy}
        menuItems={overflowMenuItems}
        menuLoading={isProcessing}
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

function createRecordingDetailStyles(c: ColorPalette) {
  return StyleSheet.create({
  notFound: withAppFont({
    color: c.textPrimary,
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
    color: c.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  }),
  deletedOverlayMessage: withAppFont({
    fontSize: 15,
    color: c.subtext,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  }),
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: c.card,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.cardXL,
    borderWidth: 1,
    borderColor: c.border,
  },
  restoreButtonText: withAppFont({
    fontSize: 17,
    fontWeight: '600',
    color: c.textPrimary,
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
  processingBannerTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  processingBannerTitle: withAppFont({
    fontSize: 14,
    fontWeight: '600',
    color: c.primary,
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
  errorBannerMessage: withAppFont({
    fontSize: 13,
    color: c.subtext,
    lineHeight: 18,
  }),
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: c.card,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    marginTop: 4,
  },
  retryButtonText: withAppFont({
    fontSize: 14,
    fontWeight: '600',
    color: c.textPrimary,
  }),
  retryButtonDisabled: {
    opacity: 0.45,
  },
  });
}
