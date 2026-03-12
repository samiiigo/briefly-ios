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
import { Recording } from '../types';
import { formatDuration, formatDate } from '../utils';
import { resolveRecordingFolder } from '../utils/recordingFolder';
import { Colors, BorderRadius } from '../utils/theme';

interface Props {
  recording: Recording;
  onPress: () => void;
  onDelete?: () => void;
  onRename?: (newTitle: string) => void;
  /** When set, card is in Recently Deleted: shows Restore and Delete permanently. */
  onRestore?: () => void;
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

export function RecordingCard({ recording, onPress, onDelete, onRename, onRestore }: Props) {
  const isFailed = recording.status === 'error';
  const isFavorite = !!recording.isFavorite;
  const folder = resolveRecordingFolder(recording);
  const isRecentlyDeleted = folder === 'recently-deleted';
  const isArchived = folder === 'archived';
  const iconEmoji = getContentEmoji(recording);
  const folderLabel =
    isRecentlyDeleted
      ? 'DELETED'
      : isArchived
        ? 'ARCHIVED'
        : 'UNLISTED';

  const folderBadgeStyle =
    folderLabel === 'ARCHIVED'
      ? styles.folderArchived
      : folderLabel === 'DELETED'
        ? styles.folderRecentlyDeleted
        : styles.folderUnlisted;

  const promptRename = () => {
    if (!onRename) return;
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Rename Recording',
        undefined,
        (text) => { if (text?.trim()) onRename(text.trim()); },
        'plain-text',
        recording.title
      );
    } else {
      // Android: rename is available from the recording detail screen
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

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      {(isFailed || isFavorite) && (
        <View style={styles.statusRow}>
          {isFailed && (
            <View style={[styles.statusIcon, styles.statusIconWarning]}>
              <Ionicons name="warning" size={14} color={Colors.orange} />
            </View>
          )}
          {isFavorite && !isRecentlyDeleted && (
            <View style={[styles.statusIcon, styles.favoriteIcon]}>
              <Ionicons name="star" size={14} color="#FFD60A" />
            </View>
          )}
        </View>
      )}

      <View style={styles.iconContainer}>
        <Text style={styles.iconEmoji}>{iconEmoji}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {recording.title}
        </Text>
        <Text style={styles.date}>
          {isRecentlyDeleted && recording.deletedAt
            ? `Deleted ${formatDate(recording.deletedAt)}`
            : formatDate(recording.createdAt)}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.duration}>{formatDuration(recording.duration)}</Text>
        </View>
      </View>

      <View style={[styles.folderBadge, folderBadgeStyle, styles.folderBadgeRight]}>
        <Text style={styles.folderBadgeText}>{folderLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28,28,30,0.6)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statusRow: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: 'rgba(10,132,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconEmoji: {
    fontSize: 30,
  },
  content: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 3,
  },
  date: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  duration: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  folderBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: StyleSheet.hairlineWidth,
  },
  folderBadgeRight: {
    alignSelf: 'flex-end',
  },
  folderUnlisted: {
    backgroundColor: 'rgba(10,132,255,0.16)',
    borderColor: 'rgba(10,132,255,0.35)',
  },
  folderArchived: {
    backgroundColor: 'rgba(191,90,242,0.18)',
    borderColor: 'rgba(191,90,242,0.45)',
  },
  folderRecentlyDeleted: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  folderBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: '#FFFFFF',
  },
});
