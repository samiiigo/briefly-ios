import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Recording } from '@/types';
import { getRecordingContentEmoji } from '@/utils/recordingContentEmoji';
import { formatDate, formatDuration } from '@/utils';
import { RecordingEmojiCircle } from '@/components/features/recording/RecordingEmojiCircle';
import { EmojiAwareText } from '@/components/features/recording/EmojiAwareText';
import { Colors } from '@/theme';

interface Props {
  recording: Recording;
}

export function RecordingTitleHero({ recording }: Props) {
  const emoji = getRecordingContentEmoji(recording);
  const meta = `${formatDate(recording.createdAt)} · ${formatDuration(recording.duration)}`;

  return (
    <View style={styles.wrap}>
      <RecordingEmojiCircle emoji={emoji} size="lg" />
      <View style={styles.textBlock}>
        <EmojiAwareText text={recording.title} style={styles.title} numberOfLines={1} />
        <Text style={styles.meta}>{meta}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: Colors.textPrimary,
  },
  meta: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.summaryMuted,
  },
});
