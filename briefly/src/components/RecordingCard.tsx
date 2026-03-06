import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recording } from '../types';
import { ProcessingBadge } from './ProcessingBadge';
import { formatDuration, formatDate } from '../utils';
import { Colors, BorderRadius, Spacing } from '../utils/theme';

interface Props {
  recording: Recording;
  onPress: () => void;
  onDelete?: () => void;
}

export function RecordingCard({ recording, onPress, onDelete }: Props) {
  const handleLongPress = () => {
    if (!onDelete) return;
    Alert.alert('Delete Recording', `Delete "${recording.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="mic" size={22} color={Colors.textSecondary} />
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.title} numberOfLines={1}>
            {recording.title}
          </Text>
          <Text style={styles.duration}>{formatDuration(recording.duration)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.date}>{formatDate(recording.createdAt)}</Text>
          <ProcessingBadge mode={recording.processingMode} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  duration: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  date: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
