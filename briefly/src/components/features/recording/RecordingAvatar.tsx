import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recording } from '@/types';
import {
  getRecordingContentEmoji,
  isRecordingProcessing,
} from '@/utils/recording/recordingContentEmoji';
import { RecordingEmojiCircle } from '@/components/features/recording/RecordingEmojiCircle';
import { RecordingProcessingRetryCircle } from '@/components/features/recording/RecordingProcessingRetryCircle';
import { RecordingProcessingFlashCircle } from '@/components/features/recording/RecordingProcessingFlashCircle';
import { useRecordingProcessingRetry } from '@/hooks/recording/useRecordingProcessingRetry';
import { useRecordingRetryFlashStore } from '@/context/useRecordingRetryFlashStore';
import { Spacing, useCreateStyles, useThemedColors } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';
interface Props {
  recording: Recording;
  size?: 'md' | 'compact';
  /** When false, the parent row controls horizontal spacing (e.g. flex `gap`). */
  trailingSpacing?: boolean;
  /** List rows: show alert + row-level retry; no inline retry button on the avatar. */
  listRow?: boolean;
}
export function RecordingAvatar({
  recording,
  size = 'md',
  trailingSpacing = true,
  listRow = false,
}: Props) {
  const styles = useCreateStyles(createRecordingAvatarStyles);
  const colors = useThemedColors();
  const compact = size === 'compact';
  const processing = isRecordingProcessing(recording);
  const failed = recording.status === 'error';
  const { action: retryAction, runRetry, showOpenableContent } =
    useRecordingProcessingRetry(recording, { forListAvatar: true });
  const showFlash = useRecordingRetryFlashStore((s) => {
    const until = s.flashUntilById[recording.id];
    return until != null && Date.now() < until;
  });
  const showRetry = failed && retryAction != null && !showFlash && !listRow;
  return (
    <View
      style={[
        styles.shell,
        compact ? styles.shellCompact : trailingSpacing && styles.shellList,
      ]}
    >
      {showFlash ? (
        <RecordingProcessingFlashCircle size={compact ? 'compact' : 'md'} />
      ) : processing ? (
        <View style={[styles.stateCircle, compact && styles.stateCircleCompact]}>
          <ActivityIndicator size="small" color={colors.textPrimary} />
        </View>
      ) : showRetry ? (
        <RecordingProcessingRetryCircle
          action={retryAction}
          onPress={runRetry}
          size={compact ? 'compact' : 'md'}
        />
      ) : failed && !showOpenableContent ? (
        <View style={[styles.stateCircle, compact && styles.stateCircleCompact]}>
          <Ionicons
            name="alert"
            size={compact ? 26 : 28}
            color={colors.orange}
          />
        </View>
      ) : (
        <RecordingEmojiCircle
          emoji={getRecordingContentEmoji(recording)}
          size="md"
        />
      )}
    </View>
  );
}
const CIRCLE_DIM = 48;
function createRecordingAvatarStyles(c: ColorPalette) {
  return StyleSheet.create({
    shell: {
      flexShrink: 0,
    },
    shellCompact: {
      alignSelf: 'center',
      marginBottom: 10,
    },
    shellList: {
      marginRight: Spacing.md,
    },
    stateCircle: {
      width: CIRCLE_DIM,
      height: CIRCLE_DIM,
      borderRadius: CIRCLE_DIM / 2,
      backgroundColor: c.emojiCircleBackground,
      borderWidth: 1,
      borderColor: c.emojiCircleBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stateCircleCompact: {
      alignSelf: 'center',
    },
  });
}
