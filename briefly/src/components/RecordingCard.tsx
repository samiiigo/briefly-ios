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
import { ProcessingBadge } from './ProcessingBadge';
import { formatDuration, formatDate } from '../utils';
import { resolveRecordingFolder } from '../utils/recordingFolder';
import { Colors, BorderRadius } from '../utils/theme';

interface Props {
  recording: Recording;
  onPress: () => void;
  onDelete?: () => void;
  onRename?: (newTitle: string) => void;
}

export function RecordingCard({ recording, onPress, onDelete, onRename }: Props) {
  const isFailed = recording.status === 'error';
  const folder = resolveRecordingFolder(recording);
  const folderLabel =
    folder === 'archived' ? 'ARCHIVED' : folder === 'favorites' ? 'FAVORITE' : 'UNLISTED';

  const folderBadgeStyle =
    folderLabel === 'ARCHIVED'
      ? styles.folderArchived
      : folderLabel === 'FAVORITE'
        ? styles.folderFavorite
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
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(recording.title, undefined, buttons);
  };

  return (
    <TouchableOpacity
      style={[styles.card, isFailed && styles.cardFailed]}
      onPress={onPress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <View style={[styles.folderBadge, folderBadgeStyle]}>
        <Text style={styles.folderBadgeText}>{folderLabel}</Text>
      </View>

      <View style={[styles.iconContainer, isFailed && styles.iconContainerFailed]}>
        <Ionicons
          name={isFailed ? 'warning' : 'musical-notes'}
          size={24}
          color={isFailed ? Colors.orange : '#0A84FF'}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {recording.title}
        </Text>
        {isFailed ? (
          <Text style={styles.failedLabel}>Transcription failed – audio only</Text>
        ) : (
          <Text style={styles.date}>{formatDate(recording.createdAt)}</Text>
        )}
        <View style={styles.metaRow}>
          <Text style={styles.duration}>{formatDuration(recording.duration)}</Text>
          {!isFailed && <ProcessingBadge mode={recording.processingMode} />}
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
    backgroundColor: 'rgba(28,28,30,0.6)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardFailed: {
    borderColor: 'rgba(255, 159, 10, 0.25)',
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
  iconContainerFailed: {
    backgroundColor: 'rgba(255, 159, 10, 0.1)',
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
    paddingRight: 90,
  },
  date: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 3,
  },
  failedLabel: {
    fontSize: 13,
    color: Colors.orange,
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
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: StyleSheet.hairlineWidth,
  },
  folderUnlisted: {
    backgroundColor: 'rgba(10,132,255,0.16)',
    borderColor: 'rgba(10,132,255,0.35)',
  },
  folderFavorite: {
    backgroundColor: 'rgba(255,159,10,0.16)',
    borderColor: 'rgba(255,159,10,0.4)',
  },
  folderArchived: {
    backgroundColor: 'rgba(191,90,242,0.18)',
    borderColor: 'rgba(191,90,242,0.45)',
  },
  folderBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: '#FFFFFF',
  },
});
