import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recording } from '@/types';
import {
  getRecordingContentEmoji,
  isRecordingProcessing,
} from '@/utils/recordingContentEmoji';
import { Colors, Spacing } from '@/theme';

interface Props {
  recording: Recording;
  size?: 'md' | 'compact';
}

export function RecordingAvatar({ recording, size = 'md' }: Props) {
  const compact = size === 'compact';
  const processing = isRecordingProcessing(recording);
  const failed = recording.status === 'error';

  return (
    <View
      style={[
        styles.container,
        compact ? styles.containerCompact : styles.containerList,
      ]}
    >
      {processing ? (
        <ActivityIndicator size="small" color={Colors.textPrimary} />
      ) : failed ? (
        <Ionicons
          name="close-circle"
          size={compact ? 26 : 28}
          color={Colors.red}
        />
      ) : (
        <Text style={[styles.emoji, compact && styles.emojiCompact]}>
          {getRecordingContentEmoji(recording)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C4C4C4',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  containerCompact: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  containerList: {
    marginRight: Spacing.md,
  },
  emoji: {
    fontSize: 22,
  },
  emojiCompact: {
    fontSize: 22,
  },
});
