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
import { formatRecentsCardDate } from '@/utils';
import { Colors, BorderRadius, Spacing } from '@/theme';

interface Props {
  recording: Recording;
  onPress: () => void;
  onRename?: (newTitle: string) => void;
  onDelete?: () => void;
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

export function RecentsEntryCard({ recording, onPress, onRename, onDelete }: Props) {
  const iconEmoji = getContentEmoji(recording);

  const handleLongPress = () => {
    const buttons: { text: string; style?: 'destructive' | 'cancel'; onPress?: () => void }[] = [];
    if (onRename) {
      buttons.push({
        text: 'Rename',
        onPress: () => {
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
        },
      });
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
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(recording.title, undefined, buttons);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={handleLongPress}
      activeOpacity={0.85}
    >
      <View style={styles.leading}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>{iconEmoji}</Text>
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {recording.title}
          </Text>
          <Text style={styles.subtitle}>{formatRecentsCardDate(recording.createdAt)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.subtext} />
    </TouchableOpacity>
  );
}

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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C4C4C4',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.subtext,
  },
});
