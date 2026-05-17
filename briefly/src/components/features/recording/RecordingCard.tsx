import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recording } from '@/types';
import { formatDuration, formatDate } from '@/utils';
import { resolveRecordingFolder } from '@/utils/folders/recordingFolder';
import { Colors, Spacing, BorderRadius, withAppFont } from '@/theme';

interface Props {
  recording: Recording;
  onPress: () => void;
  onDelete?: () => void;
  onRename?: (newTitle: string) => void;
  /** When set, card is in Recently Deleted: shows Restore and Delete permanently. */
  onRestore?: () => void;
  /** Dense tile layout for folder grid view. */
  compact?: boolean;
}

function getContentEmoji(recording: Recording): string {
  const parts: string[] = [recording.title ?? ''];
  if (recording.summary) parts.push(recording.summary);
  if (recording.keyInsights) parts.push(...recording.keyInsights.map((k) => k.text));
  const text = parts.join(' ').toLowerCase();

  if (/\b(lecture|class|course|lesson|seminar|webinar|workshop|tutorial)\b/.test(text)) {
    return '🎓';
  }
  if (/\b(podcast|episode|show|stream)\b/.test(text)) {
    return '🎧';
  }
  if (/\b(brainstorm|idea|ideas|strategy|roadmap|vision|concept)\b/.test(text)) {
    return '💡';
  }
  if (/\b(meeting|sync|standup|stand-up|retro|retrospective|planning|check-in|checkin)\b/.test(text)) {
    return '📊';
  }
  if (/\b(1:1|one-on-one|one on one)\b/.test(text)) {
    return '🤝';
  }
  if (/\b(call|zoom|teams|google meet|meet|hangouts|phone)\b/.test(text)) {
    return '📞';
  }
  if (/\b(journal|diary|reflection|reflections|therapy|counseling|counselling|mood|feelings)\b/.test(text)) {
    return '🧠';
  }
  if (/\b(sales|deal|pipeline|crm|client|customer|prospect|proposal|contract|invoice|quote)\b/.test(text)) {
    return '💼';
  }

  return '📄';
}

export function RecordingCard({
  recording,
  onPress,
  onDelete,
  onRename,
  onRestore,
  compact,
}: Props) {
  const isFailed = recording.status === 'error';
  const isFavorite = !!recording.isFavorite;
  const folder = resolveRecordingFolder(recording);
  const isRecentlyDeleted = folder === 'recently-deleted';
  const iconEmoji = getContentEmoji(recording);

  const promptRename = () => {
    if (!onRename) return;
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Rename Recording',
        undefined,
        (text) => {
          if (text?.trim()) onRename(text.trim());
        },
        'plain-text',
        recording.title
      );
    } else {
      Alert.alert('Rename', 'Open the recording to rename it from the detail screen.');
    }
  };

  const handleLongPress = () => {
    const buttons: any[] = [];
    if (onRestore) {
      buttons.push({ text: 'Restore', onPress: onRestore });
      buttons.push({
        text: 'Delete permanently',
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            'Delete permanently',
            `"${recording.title}" will be removed and cannot be recovered.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: onDelete },
            ]
          ),
      });
    } else {
      if (onRename) {
        buttons.push({ text: 'Rename', onPress: promptRename });
      }
      if (onDelete) {
        buttons.push({
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Delete Recording', `Delete "${recording.title}"?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: onDelete },
            ]),
        });
      }
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(recording.title, undefined, buttons);
  };

  const handlePress = () => {
    if (onRestore) {
      handleLongPress();
    } else {
      onPress();
    }
  };

  const dateText =
    isRecentlyDeleted && recording.deletedAt
      ? `Deleted ${formatDate(recording.deletedAt)}`
      : formatDate(recording.createdAt);

  const topRightIcons = (
    <View style={styles.topRightIcons}>
      {isFailed && (
        <View style={[styles.statusIcon, styles.statusIconWarning]}>
          <Ionicons name="warning" size={compact ? 12 : 14} color={Colors.orange} />
        </View>
      )}
      {isFavorite && !isRecentlyDeleted && (
        <View style={[styles.statusIcon, styles.favoriteIcon]}>
          <Ionicons name="star" size={compact ? 12 : 14} color="#FFD60A" />
        </View>
      )}
    </View>
  );

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.card, styles.cardCompact]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainerCompact}>
          <Text style={styles.iconEmojiCompact}>{iconEmoji}</Text>
        </View>

        <View style={styles.contentCompactInner}>
          <View style={styles.titleRowCompact}>
            <Text style={styles.titleCompact} numberOfLines={2}>
              {recording.title}
            </Text>
            {(isFailed || (isFavorite && !isRecentlyDeleted)) && (
              <View style={styles.compactTitleIcons}>{topRightIcons}</View>
            )}
          </View>
          <Text style={styles.dateCompact}>{dateText}</Text>
          <View style={styles.durationRowCompact}>
            <Text style={styles.durationCompact}>{formatDuration(recording.duration)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.iconEmoji}>{iconEmoji}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {recording.title}
          </Text>
          {(isFailed || (isFavorite && !isRecentlyDeleted)) && topRightIcons}
        </View>
        <Text style={styles.date}>{dateText}</Text>
        <View style={styles.durationRow}>
          <Text style={styles.duration}>{formatDuration(recording.duration)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardXL,
    padding: Spacing.md,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  cardCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: Spacing.md,
    marginBottom: 0,
    minHeight: 148,
  },
  topRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  compactTitleIcons: {
    marginLeft: 6,
    flexShrink: 0,
  },
  statusIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconWarning: {
    backgroundColor: 'rgba(255, 159, 10, 0.2)',
  },
  favoriteIcon: {
    backgroundColor: 'rgba(255,159,10,0.16)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C4C4C4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  iconContainerCompact: {
    width: 48,
    height: 48,
    marginBottom: 10,
    alignSelf: 'center',
    borderRadius: 24,
    backgroundColor: '#C4C4C4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 22,
  },
  iconEmojiCompact: {
    fontSize: 22,
  },
  content: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  contentCompactInner: {
    width: '100%',
    alignItems: 'stretch',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  titleRowCompact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  title: withAppFont({
    flex: 1,
    minWidth: 0,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 22,
    textAlign: 'left',
  }),
  titleCompact: withAppFont({
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 20,
    textAlign: 'left',
  }),
  date: withAppFont({
    fontSize: 14,
    color: Colors.subtext,
    textAlign: 'left',
    marginBottom: 6,
  }),
  dateCompact: withAppFont({
    fontSize: 13,
    color: Colors.subtext,
    textAlign: 'left',
    marginBottom: 6,
  }),
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  durationRowCompact: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  duration: withAppFont({
    fontSize: 14,
    color: Colors.subtext,
    textAlign: 'right',
  }),
  durationCompact: withAppFont({
    fontSize: 13,
    color: Colors.subtext,
    textAlign: 'right',
  }),
});
