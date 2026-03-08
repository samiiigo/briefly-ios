import React, { useEffect, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRecordingStore } from '../store/useRecordingStore';
import { AudioService } from '../services/AudioService';
import { RecordingCard } from '../components/RecordingCard';
import { RecordingSwipeableRow } from '../components/RecordingSwipeableRow';
import { RecordButton } from '../components/RecordButton';
import { SearchIconButton } from '../components/SearchIconButton';
import { Recording, RootStackParamList } from '../types';
import { ensureUniqueTitle, groupRecordingsByTime } from '../utils';
import { resolveRecordingFolder } from '../utils/recordingFolder';
import { Colors, Spacing, BorderRadius } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const recordings = useRecordingStore((s) => s.recordings);
  const loadRecordings = useRecordingStore((s) => s.loadRecordings);
  const deleteRecording = useRecordingStore((s) => s.deleteRecording);
  const updateRecording = useRecordingStore((s) => s.updateRecording);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => clearInterval(intervalId);
  }, []);

  const handleRename = useCallback((recording: Recording, newTitle: string) => {
    const existingTitles = recordings.filter((r) => r.id !== recording.id).map((r) => r.title);
    updateRecording(recording.id, { title: ensureUniqueTitle(newTitle, existingTitles) });
  }, [recordings, updateRecording]);

  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  const handleStartRecording = useCallback(async () => {
    const granted = await AudioService.requestPermissions();
    if (!granted) return;
    navigation.navigate('Recording', { targetFolder: 'unlisted' });
  }, [navigation]);

  const visibleRecordings = useMemo(
    () => recordings.filter(
      (r) => r.deletedAt == null && resolveRecordingFolder(r) !== 'archived'
    ),
    [recordings]
  );

  const sections = useMemo(
    () => groupRecordingsByTime(visibleRecordings),
    [visibleRecordings, now]
  );

  // #region agent log
  if (recordings.length > 0 && sections.length > 0) {
    fetch('http://127.0.0.1:7276/ingest/3b8a80c6-5c97-439c-93c0-97e4ed6ba274',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a409d8'},body:JSON.stringify({sessionId:'a409d8',location:'HomeScreen.tsx:render',message:'HomeScreen rendering with recordings',data:{recordingsCount:recordings.length,sectionsCount:sections.length},hypothesisId:'H3',timestamp:Date.now()})}).catch(()=>{});
  }
  // #endregion

  if (visibleRecordings.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Briefly</Text>
          <SearchIconButton />
        </View>

        <View style={styles.emptyState}>
          <View style={styles.emptyIconRing}>
            <View style={styles.emptyIconInner}>
              <Ionicons name="mic" size={40} color={Colors.textSecondary} />
            </View>
          </View>
          <Text style={styles.emptyTitle}>No recordings yet</Text>
          <Text style={styles.emptySubtitle}>
            Start your first recording to see your transcripts and summaries here.
          </Text>
          <TouchableOpacity style={styles.startButton} onPress={handleStartRecording}>
            <View style={styles.startButtonDot} />
            <Text style={styles.startButtonText}>Start Recording</Text>
          </TouchableOpacity>
        </View>

        <RecordButton onPress={handleStartRecording} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Briefly</Text>
        <SearchIconButton />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
            onDelete={() => deleteRecording(item.id)}
          >
            <RecordingCard
              recording={item}
              onPress={() => navigation.navigate('Transcript', { recordingId: item.id })}
              onDelete={() => deleteRecording(item.id)}
              onRename={(newTitle) => handleRename(item, newTitle)}
            />
          </RecordingSwipeableRow>
        )}
      />

      <RecordButton onPress={handleStartRecording} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: Spacing.sm,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: Spacing.contentTop,
  },
  sectionHeaderWrap: {
    backgroundColor: Colors.background,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
  },
  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIconRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyIconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  startButtonDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary,
  },
});
