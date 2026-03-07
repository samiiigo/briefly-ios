import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRecordingStore } from '../store/useRecordingStore';
import { AudioService } from '../services/AudioService';
import { RecordingCard } from '../components/RecordingCard';
import { Recording, RootStackParamList } from '../types';
import { formatGroupLabel, ensureUniqueTitle } from '../utils';
import { Colors, Spacing, BorderRadius } from '../utils/theme';
import { useSettingsStore } from '../store/useSettingsStore';
import { transcriptionModeTitle } from '../utils/transcriptionMode';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function groupRecordings(recordings: Recording[]) {
  const groups: { [key: string]: Recording[] } = { TODAY: [], 'PAST WEEK': [], OLDER: [] };
  recordings.forEach((r) => {
    const label = formatGroupLabel(r.createdAt);
    groups[label].push(r);
  });
  return Object.entries(groups)
    .filter(([, data]) => data.length > 0)
    .map(([title, data]) => ({ title, data }));
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const recordings = useRecordingStore((s) => s.recordings);
  const loadRecordings = useRecordingStore((s) => s.loadRecordings);
  const deleteRecording = useRecordingStore((s) => s.deleteRecording);
  const updateRecording = useRecordingStore((s) => s.updateRecording);
  const defaultTranscriptionMode = useSettingsStore((s) => s.defaultTranscriptionMode);

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
    Alert.alert(
      'Transcription for this recording',
      'Use your default, or override just this recording.',
      [
        {
          text: `Use default (${transcriptionModeTitle(defaultTranscriptionMode)})`,
          onPress: () => navigation.navigate('Recording'),
        },
        {
          text: 'Always on-device',
          onPress: () => navigation.navigate('Recording', { transcriptionModeOverride: 'on-device' }),
        },
        {
          text: 'Always cloud',
          onPress: () => navigation.navigate('Recording', { transcriptionModeOverride: 'cloud' }),
        },
        {
          text: 'On-device first, then cloud fallback',
          onPress: () =>
            navigation.navigate('Recording', { transcriptionModeOverride: 'on-device-first' }),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [defaultTranscriptionMode, navigation]);

  const sections = useMemo(() => groupRecordings(recordings), [recordings]);

  if (recordings.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Briefly</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="search" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
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

        <TouchableOpacity style={styles.fab} onPress={handleStartRecording}>
          <Ionicons name="mic" size={28} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Briefly</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="search" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <RecordingCard
            recording={item}
            onPress={() => navigation.navigate('Transcript', { recordingId: item.id })}
            onDelete={() => deleteRecording(item.id)}
            onRename={(newTitle) => handleRename(item, newTitle)}
          />
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={handleStartRecording}>
        <Ionicons name="mic" size={28} color="#fff" />
      </TouchableOpacity>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 120,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: Spacing.md,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.recordButton,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.recordButton,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
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
