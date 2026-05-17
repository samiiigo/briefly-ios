import React, { useEffect, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useActiveSwipeableStore } from '@/context/useActiveSwipeableStore';
import { useRecordingStore } from '@/context/useRecordingStore';
import { RecordingService } from '@/services/audio';
import { RecentsHeader } from '@/components/features/recents/RecentsHeader';
import { TopBlurFade } from '@/components/navigation/TopBlurFade';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import { RecentsEntryCard } from '@/components/features/recents/RecentsEntryCard';
import { RecordingSwipeableRow } from '@/components/features/recording/RecordingSwipeableRow';
import { Recording } from '@/types';
import {
  ensureUniqueTitle,
  groupRecordingsByTime,
  formatRecentsGroupLabel,
} from '@/utils';
import { resolveRecordingFolder } from '@/utils/folders/recordingFolder';
import { Colors, Spacing, withAppFont } from '@/theme';

const LIST_BOTTOM_PADDING = 140;

export default function HomeScreen() {
  const { scrollPaddingTop, topInset } = useTopChromeLayout();
  const router = useRouter();
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

  const handleRename = useCallback(
    async (recording: Recording, newTitle: string) => {
      const existingTitles = recordings
        .filter((r) => r.id !== recording.id)
        .map((r) => r.title);
      try {
        await updateRecording(recording.id, {
          title: ensureUniqueTitle(newTitle, existingTitles),
        });
      } catch (err) {
        console.error('Failed to rename recording:', err);
      }
    },
    [recordings, updateRecording]
  );

  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  const handleStartRecording = useCallback(async () => {
    const granted = await RecordingService.requestPermissions();
    if (!granted) return;
    router.push({ pathname: '/recording/new', params: { targetFolder: 'unlisted' } });
  }, [router]);

  const visibleRecordings = useMemo(
    () =>
      recordings.filter(
        (r) => r.deletedAt == null && resolveRecordingFolder(r) !== 'archived'
      ),
    [recordings]
  );

  const sections = useMemo(() => {
    void now;
    return groupRecordingsByTime(visibleRecordings, formatRecentsGroupLabel);
  }, [visibleRecordings, now]);

  const closeOpenSwipe = useCallback(() => {
    useActiveSwipeableStore.getState().closeActive();
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => closeOpenSwipe();
    }, [closeOpenSwipe])
  );

  if (visibleRecordings.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.emptyState, { paddingTop: scrollPaddingTop }]}>
          <View style={styles.emptyIconRing}>
            <View style={styles.emptyIconInner}>
              <Ionicons name="mic" size={40} color={Colors.subtext} />
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

        <TopBlurFade />
        <View style={[styles.headerOverlay, { paddingTop: topInset }]} pointerEvents="box-none">
          <RecentsHeader />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingTop: scrollPaddingTop }]}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={closeOpenSwipe}
        onMomentumScrollBegin={closeOpenSwipe}
        ItemSeparatorComponent={() => <View style={styles.itemGap} />}
        SectionSeparatorComponent={() => <View style={styles.sectionGap} />}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <RecordingSwipeableRow
            recording={item}
            onPress={() => router.push(`/recording/${item.id}`)}
            onDelete={() => deleteRecording(item.id)}
          >
            <RecentsEntryCard
              recording={item}
              onPress={() => router.push(`/recording/${item.id}`)}
              onDelete={() => deleteRecording(item.id)}
              onRename={(newTitle) => handleRename(item, newTitle)}
            />
          </RecordingSwipeableRow>
        )}
      />

      <TopBlurFade />
      <View style={[styles.headerOverlay, { paddingTop: topInset }]} pointerEvents="box-none">
        <RecentsHeader />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: LIST_BOTTOM_PADDING,
  },
  sectionHeader: withAppFont({
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 16,
    color: Colors.subtext,
    marginBottom: 0,
    paddingHorizontal: Spacing.sm,
  }),
  itemGap: {
    height: 12,
  },
  sectionGap: {
    height: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: LIST_BOTTOM_PADDING,
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
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: withAppFont({
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  }),
  emptySubtitle: withAppFont({
    fontSize: 15,
    color: Colors.subtext,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  }),
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 16,
    gap: Spacing.sm,
  },
  startButtonDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  startButtonText: withAppFont({
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary,
  }),
});
