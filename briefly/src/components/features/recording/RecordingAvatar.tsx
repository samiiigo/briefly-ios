import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recording } from '@/types';
import {
  getRecordingContentEmoji,
  isRecordingProcessing,
} from '@/utils/recording/recordingContentEmoji';
import { RecordingEmojiCircle } from '@/components/features/recording/RecordingEmojiCircle';
import { Colors, Spacing } from '@/theme';

interface Props {
  recording: Recording;
  size?: 'md' | 'compact';
  /** When false, the parent row controls horizontal spacing (e.g. flex `gap`). */
  trailingSpacing?: boolean;
}

export function RecordingAvatar({
  recording,
  size = 'md',
  trailingSpacing = true,
}: Props) {
  const compact = size === 'compact';
  const processing = isRecordingProcessing(recording);
  const failed = recording.status === 'error';

  return (
    <View
      style={[
        styles.shell,
        compact ? styles.shellCompact : trailingSpacing && styles.shellList,
      ]}
    >
      {processing ? (
        <View style={[styles.stateCircle, compact && styles.stateCircleCompact]}>
          <ActivityIndicator size="small" color={Colors.textPrimary} />
        </View>
      ) : failed ? (
        <View style={[styles.stateCircle, compact && styles.stateCircleCompact]}>
          <Ionicons
            name="close-circle"
            size={compact ? 26 : 28}
            color={Colors.red}
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

const styles = StyleSheet.create({
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.emojiCircleBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateCircleCompact: {
    alignSelf: 'center',
  },
});
