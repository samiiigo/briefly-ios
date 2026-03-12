import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AudioService } from '../services/AudioService';
import { useRecordingStore } from '../store/useRecordingStore';
import { RecordingCard } from '../components/RecordingCard';
import { RecordingSwipeableRow } from '../components/RecordingSwipeableRow';
import { RecordButton } from '../components/RecordButton';
import { RootStackParamList } from '../types';
import { resolveRecordingFolder } from '../utils/recordingFolder';
import { groupRecordingsByTime } from '../utils';
import { Colors, Spacing } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'FolderRecordings'>;

export function FolderRecordingsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { folderId, folderName, folderType } = route.params;
  const recordings = useRecordingStore((s) => s.recordings);
  const deleteRecording = useRecordingStore((s) => s.deleteRecording);
  const restoreRecording = useRecordingStore((s) => s.restoreRecording);
  const permanentDelete = useRecordingStore((s) => s.permanentDelete);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(intervalId);
  }, []);

  const isRecentlyDeleted = folderId === 'recently-deleted';
  const filtered = useMemo(() => {
    if (folderType === 'built-in') {
      if (folderId === 'archived') {
        return recordings.filter((r) => r.deletedAt == null && r.isArchived);
      }
      if (folderId === 'recently-deleted') {
        return recordings.filter((r) => r.deletedAt != null);
      }
    }
    return recordings.filter((r) => r.userFolderId === folderId);
  }, [recordings, folderId, folderType]);

  const sections = useMemo(
    () => groupRecordingsByTime(filtered),
    [filtered, now]
  );

  const handleRecordIntoFolder = useCallback(async () => {
    if (isRecentlyDeleted) return;
    const granted = await AudioService.requestPermissions();
    if (!granted) return;
    if (folderType === 'user') {
      navigation.navigate('Recording', { targetFolder: 'unlisted', targetUserFolderId: folderId });
    } else if (folderId === 'archived') {
      navigation.navigate('Recording', {
        targetFolder: 'archived',
      });
    }
  }, [navigation, folderType, folderId, isRecentlyDeleted]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {folderName}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No recordings in this folder.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeaderWrap}>
              <Text style={styles.sectionHeader}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <RecordingSwipeableRow
              recording={item}
              onPress={() => navigation.navigate('Transcript', { recordingId: item.id })}
              onDelete={isRecentlyDeleted ? () => permanentDelete(item.id) : () => deleteRecording(item.id)}
              onRestore={isRecentlyDeleted ? () => restoreRecording(item.id) : undefined}
              isRecentlyDeleted={isRecentlyDeleted}
            >
              <RecordingCard
                recording={item}
                onPress={() => navigation.navigate('Transcript', { recordingId: item.id })}
                onDelete={isRecentlyDeleted ? () => permanentDelete(item.id) : () => deleteRecording(item.id)}
                onRestore={isRecentlyDeleted ? () => restoreRecording(item.id) : undefined}
              />
            </RecordingSwipeableRow>
          )}
        />
      )}
      {!isRecentlyDeleted && (
        <RecordButton
          onPress={handleRecordIntoFolder}
          style={{ bottom: 40 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  sectionHeaderWrap: {
    backgroundColor: Colors.background,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  emptyWrap: {
    flex: 1,
    padding: Spacing.md,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
  },
});
