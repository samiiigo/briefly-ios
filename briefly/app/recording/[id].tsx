import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { KeyInsights } from '@/components/features/recording/KeyInsights';
import { RecordingTitleHero } from '@/components/features/recording/RecordingTitleHero';
import { RecordingProcessingFlashIcon } from '@/components/features/recording/RecordingProcessingFlashIcon';
import { SummaryMarkdownSection } from '@/components/features/recording/SummaryMarkdownSection';
import { RecordingDetailHeader } from '@/components/features/recording/RecordingDetailChrome';
import { RecordingPlaybackBar } from '@/components/features/recording/RecordingPlaybackBar';
import { StackScreenHeader } from '@/components/navigation/header/StackScreenHeader';
import { usePlaybackBarLayout } from '@/components/navigation/layout/usePlaybackBarLayout';
import { useTopChromeLayout } from '@/components/navigation/layout/useTopChromeLayout';
import { useScreenLayoutStyles } from '@/components/navigation/layout/screenLayout';
import { TextInputDialog } from '@/components/ui/TextInputDialog';
import { builtInFolderName } from '@/constants/builtInFolders';
import { useRecordingDetail } from '@/hooks/recording/useRecordingDetail';
import {
  Spacing,
  BorderRadius,
  useCreateStyles,
  useThemedColors,
  withAppFont,
} from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';

export default function RecordingDetailScreen() {
  const st = useCreateStyles(createRecordingDetailStyles);
  const colors = useThemedColors();
  const sl = useScreenLayoutStyles();
  const { scrollPaddingTop } = useTopChromeLayout();
  const { paddingBottom: playbackBottom } = usePlaybackBarLayout();
  const { id: recordingId } = useLocalSearchParams<{ id: string }>();
  const {
    recording,
    folderLabel,
    playback,
    shareBusy,
    shareMenuItems,
    renameDialogVisible,
    setRenameDialogVisible,
    submitRename,
    handleRestoreDeleted,
    overflowMenuItems,
    rerun,
    goBack,
  } = useRecordingDetail(recordingId);

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
          <Text style={st.deletedOverlayMessage}>Restore this recording to open it.</Text>
          <TouchableOpacity style={st.restoreButton} onPress={handleRestoreDeleted}>
            <Ionicons name="arrow-undo" size={20} color={colors.textPrimary} />
            <Text style={st.restoreButtonText}>Restore recording</Text>
          </TouchableOpacity>
        </View>
        <StackScreenHeader
          title={builtInFolderName('recently-deleted')}
          showBack
          onBack={goBack}
        />
      </View>
    );
  }

  const { hasAudio, showProcessingBanner, hideAudioMissingBanner } = rerun;

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
                {recording.status === 'saved' && rerun.hasTranscript
                  ? 'Summarization pending'
                  : recording.status === 'saved'
                    ? 'Ready to process'
                    : 'Processing incomplete'}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                st.retryButton,
                rerun.manualRerunButtonDisabled && st.retryButtonDisabled,
              ]}
              onPress={rerun.runManualPipeline}
              disabled={rerun.manualRerunButtonDisabled}
            >
              {rerun.flashActive ? (
                <RecordingProcessingFlashIcon size={18} />
              ) : (
                <Ionicons name="sparkles" size={15} color={colors.textPrimary} />
              )}
              <Text style={st.retryButtonText}>
                {recording.status === 'saved' && rerun.hasTranscript
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
        onBack={goBack}
        folderLabel={folderLabel}
        shareItems={shareMenuItems}
        shareLoading={shareBusy}
        menuItems={overflowMenuItems}
        menuLoading={rerun.isProcessing}
      />
      <TextInputDialog
        visible={renameDialogVisible}
        title="Rename Recording"
        defaultValue={recording.title}
        placeholder="Recording name"
        submitLabel="Rename"
        onSubmit={(text) => {
          setRenameDialogVisible(false);
          submitRename(text);
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
