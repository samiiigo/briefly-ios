import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Recording } from '@/types';
import { getRecordingContentEmoji } from '@/utils/recording/recordingContentEmoji';
import { formatDate, formatDuration } from '@/utils';
import { RecordingEmojiCircle } from '@/components/features/recording/RecordingEmojiCircle';
import { RecordingProcessingRetryCircle } from '@/components/features/recording/RecordingProcessingRetryCircle';
import { RecordingProcessingFlashCircle } from '@/components/features/recording/RecordingProcessingFlashCircle';
import { EmojiAwareText } from '@/components/features/recording/EmojiAwareText';
import { useRecordingProcessingRetry } from '@/hooks/useRecordingProcessingRetry';
import { useRecordingRetryFlashStore } from '@/context/useRecordingRetryFlashStore';
import { isRecordingProcessing } from '@/utils/recording/recordingContentEmoji';
import { useCreateStyles, useThemedColors, withAppFont } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';

interface Props {
  recording: Recording;
}

const HERO_CIRCLE = 56;

export function RecordingTitleHero({ recording }: Props) {
  const styles = useCreateStyles(createRecordingTitleHeroStyles);
  const colors = useThemedColors();
  const emoji = getRecordingContentEmoji(recording);
  const meta = `${formatDate(recording.createdAt)} · ${formatDuration(recording.duration)}`;
  const processing = isRecordingProcessing(recording);
  const { action: retryAction, runRetry, showOpenableContent } =
    useRecordingProcessingRetry(recording);
  const flashActive = useRecordingRetryFlashStore((s) => {
    const until = s.flashUntilById[recording.id];
    return until != null && Date.now() < until;
  });
  const showRetry =
    recording.status === 'error' && retryAction != null && !showOpenableContent && !flashActive;

  const leading = flashActive ? (
    <RecordingProcessingFlashCircle size="lg" />
  ) : processing ? (
    <View style={styles.processingCircle}>
      <ActivityIndicator size="small" color={colors.textPrimary} />
    </View>
  ) : showRetry ? (
    <RecordingProcessingRetryCircle action={retryAction} onPress={runRetry} size="lg" />
  ) : (
    <RecordingEmojiCircle emoji={emoji} size="lg" />
  );

  return (
    <View style={styles.wrap}>
      {leading}
      <View style={styles.textBlock}>
        <EmojiAwareText text={recording.title} style={styles.title} numberOfLines={1} />
        <Text style={styles.meta}>{meta}</Text>
      </View>
    </View>
  );
}

function createRecordingTitleHeroStyles(c: ColorPalette) {
  return StyleSheet.create({
    processingCircle: {
      width: HERO_CIRCLE,
      height: HERO_CIRCLE,
      borderRadius: HERO_CIRCLE / 2,
      backgroundColor: c.emojiCircleBackground,
      borderWidth: 1,
      borderColor: c.emojiCircleBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 8,
      paddingBottom: 16,
    },
    textBlock: {
      flex: 1,
      marginLeft: 16,
      gap: 3,
    },
    title: withAppFont({
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 28,
      color: c.textPrimary,
    }),
    meta: withAppFont({
      fontSize: 13,
      lineHeight: 20,
      color: c.summaryMuted,
    }),
  });
}
