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
        <Ionicons name="musical-notes" size={24} color="#0A84FF" />
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {recording.title}
        </Text>
        <Text style={styles.date}>{formatDate(recording.createdAt)}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.duration}>{formatDuration(recording.duration)}</Text>
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
    backgroundColor: 'rgba(28,28,30,0.6)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
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
  content: {
    flex: 1,
    justifyContent: 'center',
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
});
