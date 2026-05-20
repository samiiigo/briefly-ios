import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Recording } from '@/types';
import { getRecordingContentEmoji } from '@/utils/recording/recordingContentEmoji';
import { formatDate, formatDuration } from '@/utils';
import { RecordingEmojiCircle } from '@/components/features/recording/RecordingEmojiCircle';
import { EmojiAwareText } from '@/components/features/recording/EmojiAwareText';
import { useCreateStyles, withAppFont } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';

interface Props {
  recording: Recording;
}

export function RecordingTitleHero({ recording }: Props) {
  const styles = useCreateStyles(createRecordingTitleHeroStyles);
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

function createRecordingTitleHeroStyles(c: ColorPalette) {
  return StyleSheet.create({
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
