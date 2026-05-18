import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recording } from '@/types';
import { formatSearchResultDate } from '@/utils';
import { isRecordingProcessing } from '@/utils/recording/recordingContentEmoji';
import { HighlightedText } from './HighlightedText';
import { Colors, BorderRadius, Spacing, withAppFont } from '@/theme';

interface Props {
  recording: Recording;
  query: string;
  onPress: () => void;
}

function SearchResultLeadingIcon({ recording }: { recording: Recording }) {
  const processing = isRecordingProcessing(recording);
  const failed = recording.status === 'error';

  if (processing) {
    return (
      <View style={styles.iconCircle}>
        <ActivityIndicator size="small" color={Colors.textPrimary} />
      </View>
    );
  }

  if (failed) {
    return (
      <View style={styles.iconCircle}>
        <Ionicons name="close-circle" size={26} color={Colors.red} />
      </View>
    );
  }

  return (
    <View style={styles.iconCircle}>
      <Ionicons name="document-text-outline" size={22} color={Colors.subtext} />
    </View>
  );
}

function SearchResultItemComponent({ recording, query, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      <View style={styles.leading}>
        <SearchResultLeadingIcon recording={recording} />
        <View style={styles.textBlock}>
          <HighlightedText
            text={recording.title}
            query={query}
            style={styles.title}
            numberOfLines={1}
          />
          <Text style={styles.subtitle} numberOfLines={1}>
            {formatSearchResultDate(recording.createdAt)}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.subtext} />
    </TouchableOpacity>
  );
}

export const SearchResultItem = memo(SearchResultItemComponent);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardXL,
    padding: Spacing.md,
  },
  leading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minWidth: 0,
    marginRight: Spacing.sm,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: withAppFont({
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 4,
  }),
  subtitle: withAppFont({
    fontSize: 14,
    color: Colors.subtext,
  }),
});
